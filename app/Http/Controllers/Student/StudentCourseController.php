<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ContentItemComment;
use App\Models\ContentItemSubmission;
use App\Models\ContentItemView;
use App\Models\CourseContentCategory;
use App\Models\CourseContentItem;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Services\CourseContentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentCourseController extends Controller
{
    public function __construct(private readonly CourseContentService $contentService) {}

    public function index(Request $request): Response
    {
        $this->markContentAsViewed();

        $enrollments = Enrollment::query()
            ->where('student_id', auth()->id())
            ->with(['courseware.professorAccount', 'courseware.academicTerm'])
            ->get();

        $search = trim((string) $request->query('search', ''));

        $enrollResults = $search === ''
            ? collect()
            : Courseware::query()
                ->whereDoesntHave('enrollments', function ($query): void {
                    $query->where('student_id', auth()->id());
                })
                ->where('subject_code', 'like', "%{$search}%")
                ->orderBy('subject')
                ->limit(20)
                ->get(['id', 'subject', 'subject_code', 'professor', 'module_title']);

        return Inertia::render('student/courses/index', [
            'courses' => $enrollments->map(fn ($enrollment) => [
                'id' => $enrollment->courseware->id,
                'subject' => $enrollment->courseware->subject,
                'module_title' => $enrollment->courseware->module_title,
                'professor' => $enrollment->courseware->professor,
                'today_hyflex_mode' => $enrollment->courseware->todaysHyflexMode(),
            ]),
            'enroll_search' => [
                'query' => $search,
                'results' => $enrollResults,
            ],
        ]);
    }

    public function show(Courseware $courseware): Response
    {
        $this->markContentAsViewed();

        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $courseware->id)
                ->where('student_id', auth()->id())
                ->exists(),
            404,
        );

        // Quizzes attached to a module (see the professor's "Add Quiz" flow)
        // only ever appear inside that module, once it's been read — they're
        // excluded here so they don't also show up in this subject-wide list.
        $quizzes = $courseware->quizzes()
            ->where('is_published', true)
            ->whereDoesntHave('contentItem')
            ->with(['attempts' => function ($query): void {
                $query->where('student_id', auth()->id());
            }])
            ->get();

        $categories = $this->contentService->categoriesFor($courseware);

        $mySubmissions = ContentItemSubmission::where('student_id', auth()->id())
            ->whereIn('course_content_item_id', $categories->flatMap(fn (CourseContentCategory $category) => $category->items->pluck('id')))
            ->get()
            ->keyBy('course_content_item_id');

        $publishedItemIds = $categories
            ->flatMap(fn (CourseContentCategory $category) => $category->items->where('is_published', true)->pluck('id'));

        $myViews = ContentItemView::where('student_id', auth()->id())
            ->whereIn('course_content_item_id', $publishedItemIds)
            ->get()
            ->keyBy('course_content_item_id');

        $linkedQuizIds = $categories
            ->flatMap(fn (CourseContentCategory $category) => $category->items->pluck('quiz_id'))
            ->filter()
            ->values();

        $myQuizAttempts = QuizAttempt::where('student_id', auth()->id())
            ->whereIn('quiz_id', $linkedQuizIds)
            ->get()
            ->keyBy('quiz_id');

        $term = $courseware->academicTerm;

        return Inertia::render('student/courses/show', [
            'courseware' => [
                ...$courseware->only(['id', 'subject', 'module_title', 'professor']),
                'meeting_link' => $courseware->meetingUrl(),
                'uses_embedded_meeting' => $courseware->usesEmbeddedMeeting(),
            ],
            'quizzes' => $quizzes->map(fn ($quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'deadline' => $quiz->deadline?->toIso8601String(),
                'attempted' => $quiz->attempts->isNotEmpty(),
                'score' => $quiz->attempts->first()?->score,
                'correct_count' => $quiz->attempts->first()?->correct_count,
                'total_questions' => $quiz->attempts->first()?->total_questions,
                'can_attempt' => ! $quiz->isPastDeadline() || $quiz->hasLateExceptionFor(auth()->id()),
            ]),
            'content_categories' => $categories->map(fn (CourseContentCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'requires_submission' => $category->requires_submission,
                'items' => $category->items
                    ->where('is_published', true)
                    ->values()
                    ->map(function (CourseContentItem $item) use ($mySubmissions, $myViews, $term, $myQuizAttempts, $courseware) {
                        $submission = $mySubmissions->get($item->id);
                        $view = $myViews->get($item->id);
                        $hasFinishedReading = $view && $view->finished_at !== null;
                        $week = $term?->weekNumberFor($item->created_at);

                        return [
                            'id' => $item->id,
                            'title' => $item->title,
                            'description' => $item->description,
                            'link' => $item->link,
                            'file_url' => $item->file_path ? Storage::url($item->file_path) : null,
                            'file_name' => $item->file_original_name,
                            'timing_mode' => $item->timing_mode,
                            'time_limit_minutes' => $item->time_limit_minutes,
                            'week' => $week,
                            'hyflex_mode' => $term && $week !== null && $courseware->hyflex_group
                                ? $term->hyflexModeForWeek($week, $courseware->hyflex_group)
                                : null,
                            'view' => $this->viewData($item, $myViews),
                            // The module's own quiz only shows up once the
                            // student has actually finished reading it — not
                            // before, and never in the subject-wide list.
                            'quiz' => ($hasFinishedReading && $item->quiz && $item->quiz->is_published) ? [
                                'id' => $item->quiz->id,
                                'title' => $item->quiz->title,
                                'deadline' => $item->quiz->deadline?->toIso8601String(),
                                'attempted' => $myQuizAttempts->has($item->quiz_id),
                                'score' => $myQuizAttempts->get($item->quiz_id)?->score,
                                'correct_count' => $myQuizAttempts->get($item->quiz_id)?->correct_count,
                                'total_questions' => $myQuizAttempts->get($item->quiz_id)?->total_questions,
                                'can_attempt' => ! $item->quiz->isPastDeadline() || $item->quiz->hasLateExceptionFor(auth()->id()),
                            ] : null,
                            'deadline' => $item->deadline?->toIso8601String(),
                            'can_submit' => ! $item->isPastDeadline() || $item->hasLateExceptionFor(auth()->id()),
                            'max_points' => $item->max_points,
                            'my_submission' => $submission ? [
                                'file_url' => Storage::url($submission->file_path),
                                'file_name' => $submission->file_original_name,
                                'submitted_at' => $submission->submitted_at->toIso8601String(),
                                'acknowledged_at' => $submission->acknowledged_at?->toIso8601String(),
                                'score' => $submission->score,
                            ] : null,
                            'comments' => $item->comments->map(fn (ContentItemComment $comment) => [
                                'id' => $comment->id,
                                'body' => $comment->body,
                                'author_name' => $comment->user->name,
                                'author_role' => $comment->user->role,
                                'created_at' => $comment->created_at->toIso8601String(),
                            ]),
                        ];
                    }),
            ]),
        ]);
    }

    public function meeting(Courseware $courseware): Response
    {
        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $courseware->id)
                ->where('student_id', auth()->id())
                ->exists(),
            404,
        );

        $meetingUrl = $courseware->meetingUrl();

        return Inertia::render('student/courses/meeting', [
            'courseware' => $courseware->only(['id', 'subject']),
            'meeting' => [
                'url' => $meetingUrl,
                'domain' => 'meet.jit.si',
                'room_name' => Str::after($meetingUrl, 'meet.jit.si/'),
                'is_embedded' => $courseware->usesEmbeddedMeeting(),
                'is_live' => $courseware->isMeetingLive(),
                'schedule_state' => $courseware->classScheduleState(),
                'class_start_time' => $courseware->class_start_time?->format('H:i'),
                'class_end_time' => $courseware->class_end_time?->format('H:i'),
            ],
        ]);
    }

    public function startContentItem(CourseContentItem $item): RedirectResponse
    {
        $this->authorizeContentItemAccess($item);

        ContentItemView::firstOrCreate(
            ['course_content_item_id' => $item->id, 'student_id' => auth()->id()],
            ['started_at' => now()],
        );

        return back();
    }

    public function markContentFinished(CourseContentItem $item): RedirectResponse
    {
        $this->authorizeContentItemAccess($item);

        $view = ContentItemView::firstOrCreate(
            ['course_content_item_id' => $item->id, 'student_id' => auth()->id()],
            ['started_at' => now()],
        );

        if (! $view->finished_at) {
            $view->update(['finished_at' => now()]);
        }

        return back()->with('success', "\"{$item->title}\" marked as finished.");
    }

    private function authorizeContentItemAccess(CourseContentItem $item): void
    {
        abort_unless($item->is_published, 404);

        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $item->category->courseware_id)
                ->where('student_id', auth()->id())
                ->exists(),
            404,
        );
    }

    private function viewData(CourseContentItem $item, Collection $views): ?array
    {
        $view = $views->get($item->id);

        if (! $view) {
            return null;
        }

        return [
            'started_at' => $view->started_at->toIso8601String(),
            'finished_at' => $view->finished_at?->toIso8601String(),
            'expires_at' => $item->timing_mode === 'timer' && $item->time_limit_minutes && ! $view->finished_at
                ? $view->started_at->clone()->addMinutes($item->time_limit_minutes)->toIso8601String()
                : null,
        ];
    }

    private function markContentAsViewed(): void
    {
        $user = auth()->user();
        $user->content_last_viewed_at = now();
        $user->save();
    }
}
