<?php

namespace App\Http\Controllers\Professor;

use App\Events\CourseContentUpdated;
use App\Http\Controllers\Controller;
use App\Models\ContentItemComment;
use App\Models\ContentItemSubmission;
use App\Models\CourseContentCategory;
use App\Models\CourseContentItem;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\GradeScore;
use App\Models\LateException;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\CourseContentService;
use App\Services\TermGradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorCourseContentController extends Controller
{
    private const TIMING_MODES = ['timestamp', 'timer'];

    private const WORK_TYPES = ['assignment', 'activity', 'learning_material'];

    /**
     * A module's work_type maps directly onto the grading system's category
     * of the same purpose ("Assignments"/"Activities" — both auto-provisioned
     * for every term by TermGradingService), so a graded submission lands in
     * the correct bucket instead of everything defaulting to one category.
     * `learning_material` has no entry on purpose — it's ungraded reference
     * content, never expected to produce a submission to sync in the first
     * place (see syncScoreToGradingSystem()'s fallback for the unlikely case).
     */
    private const WORK_TYPE_GRADE_CATEGORY_NAMES = [
        'assignment' => 'Assignments',
        'activity' => 'Activities',
    ];

    public function __construct(
        private readonly CourseContentService $contentService,
        private readonly TermGradingService $gradingService,
    ) {}

    public function index(Courseware $courseware): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $categories = $this->contentService->categoriesFor($courseware);
        $term = $courseware->academicTerm;

        return Inertia::render('professor/courses/content', [
            'courseware' => [
                ...$courseware->only(['id', 'subject', 'year_level', 'section']),
                'meeting_link' => $courseware->meetingUrl(),
                'uses_embedded_meeting' => $courseware->usesEmbeddedMeeting(),
            ],
            'categories' => $categories->map(fn (CourseContentCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'requires_submission' => $category->requires_submission,
                'items' => $category->items->map(fn (CourseContentItem $item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'link' => $item->link,
                    'file_url' => $item->file_path ? Storage::url($item->file_path) : null,
                    'file_name' => $item->file_original_name,
                    'is_published' => $item->is_published,
                    'timing_mode' => $item->timing_mode,
                    'time_limit_minutes' => $item->time_limit_minutes,
                    'work_type' => $item->work_type,
                    'delivery_mode' => $item->delivery_mode,
                    'week' => $term?->weekNumberFor($item->created_at),
                    'hyflex_mode' => ($item->delivery_mode === 'hyflex' && $term && $courseware->hyflex_group)
                        ? $term->hyflexModeForWeek($term->weekNumberFor($item->created_at), $courseware->hyflex_group)
                        : null,
                    'submissions_count' => $item->submissions()->count(),
                    'quiz' => $item->quiz ? [
                        'id' => $item->quiz->id,
                        'title' => $item->quiz->title,
                        'is_published' => $item->quiz->is_published,
                        'questions_count' => $item->quiz->questions()->count(),
                    ] : null,
                    'comments' => $item->comments->map(fn (ContentItemComment $comment) => [
                        'id' => $comment->id,
                        'body' => $comment->body,
                        'author_name' => $comment->user->name,
                        'author_role' => $comment->user->role,
                        'created_at' => $comment->created_at->toIso8601String(),
                    ]),
                ]),
            ]),
        ]);
    }

    public function storeItem(Request $request, Courseware $courseware, CourseContentCategory $category): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($category->courseware_id === $courseware->id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'link' => ['nullable', 'url', 'max:2048'],
            'file' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip,jpg,jpeg,png'],
            'is_published' => ['nullable', 'boolean'],
            'timing_mode' => ['required', Rule::in(self::TIMING_MODES)],
            'time_limit_minutes' => ['required_if:timing_mode,timer', 'nullable', 'integer', 'min:1', 'max:600'],
            'work_type' => ['required', Rule::in(self::WORK_TYPES)],
            'deadline' => ['nullable', 'date'],
            'max_points' => ['nullable', 'integer', 'min:1'],
            'next' => ['nullable', Rule::in(['quiz_create', 'quiz_import'])],
        ]);

        $filePath = null;
        $fileOriginalName = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('course-content', 'public');
            $fileOriginalName = $request->file('file')->getClientOriginalName();
        }

        $item = $category->items()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'link' => $validated['link'] ?? null,
            'file_path' => $filePath,
            'file_original_name' => $fileOriginalName,
            'order' => $category->items()->count(),
            'is_published' => $validated['is_published'] ?? false,
            'timing_mode' => $validated['timing_mode'],
            'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
            'work_type' => $validated['work_type'],
            'deadline' => $validated['deadline'] ?? null,
            'max_points' => $validated['max_points'] ?? 100,
        ]);

        CourseContentUpdated::dispatchSafely($courseware->id);

        // Saving from the "Add Quiz"/"Import Quiz" button continues straight
        // into building the quiz instead of landing back on the content
        // list — the new module is already saved by this point.
        if (($validated['next'] ?? null) === 'quiz_create') {
            return Redirect::route('professor.quizzes.create', [
                'content_item_id' => $item->id,
                'courseware_id' => $courseware->id,
            ]);
        }

        if (($validated['next'] ?? null) === 'quiz_import') {
            return Redirect::route('professor.quizzes.import', [
                'content_item_id' => $item->id,
                'courseware_id' => $courseware->id,
            ]);
        }

        return Redirect::route('professor.content.index', $courseware)
            ->with('success', 'Item was added successfully.');
    }

    public function editItem(Courseware $courseware, CourseContentItem $item): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        return Inertia::render('professor/courses/content-upload', [
            'courseware' => $courseware->only(['id', 'subject']),
            'category' => $item->category->only(['id', 'name']),
            'item' => [
                'id' => $item->id,
                'title' => $item->title,
                'description' => $item->description,
                'link' => $item->link,
                'file_url' => $item->file_path ? Storage::url($item->file_path) : null,
                'file_name' => $item->file_original_name,
                'is_published' => $item->is_published,
                'timing_mode' => $item->timing_mode,
                'time_limit_minutes' => $item->time_limit_minutes,
                'work_type' => $item->work_type,
                'delivery_mode' => $item->delivery_mode,
                'deadline' => $item->deadline?->format('Y-m-d\TH:i'),
                'max_points' => $item->max_points,
                'week' => $courseware->academicTerm?->weekNumberFor($item->created_at),
                'quiz' => $item->quiz ? [
                    'id' => $item->quiz->id,
                    'title' => $item->quiz->title,
                    'is_published' => $item->quiz->is_published,
                    'questions_count' => $item->quiz->questions()->count(),
                ] : null,
            ],
        ]);
    }

    public function updateItem(Request $request, Courseware $courseware, CourseContentItem $item): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'link' => ['nullable', 'url', 'max:2048'],
            'file' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip,jpg,jpeg,png'],
            'is_published' => ['nullable', 'boolean'],
            'timing_mode' => ['required', Rule::in(self::TIMING_MODES)],
            'time_limit_minutes' => ['required_if:timing_mode,timer', 'nullable', 'integer', 'min:1', 'max:600'],
            'work_type' => ['required', Rule::in(self::WORK_TYPES)],
            'deadline' => ['nullable', 'date'],
            'max_points' => ['nullable', 'integer', 'min:1'],
        ]);

        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'link' => $validated['link'] ?? null,
            'is_published' => $validated['is_published'] ?? $item->is_published,
            'timing_mode' => $validated['timing_mode'],
            'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
            'work_type' => $validated['work_type'],
            'deadline' => $validated['deadline'] ?? null,
            // Not resubmitted when the form hid the field for a Learning
            // Material module — keep whatever the item already had rather
            // than silently resetting it to the generic default.
            'max_points' => $validated['max_points'] ?? $item->max_points ?? 100,
        ];

        if ($request->hasFile('file')) {
            if ($item->file_path) {
                Storage::disk('public')->delete($item->file_path);
            }

            $updateData['file_path'] = $request->file('file')->store('course-content', 'public');
            $updateData['file_original_name'] = $request->file('file')->getClientOriginalName();
        }

        $item->update($updateData);

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.content.index', $courseware)
            ->with('success', 'Item was updated successfully.');
    }

    public function togglePublish(Courseware $courseware, CourseContentItem $item): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $item->is_published = ! $item->is_published;
        $item->save();

        $status = $item->is_published ? 'published' : 'unpublished';

        CourseContentUpdated::dispatchSafely($courseware->id);

        return back()->with('success', "\"{$item->title}\" was {$status}.");
    }

    public function storeComment(Request $request, Courseware $courseware, CourseContentItem $item): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $item->comments()->create([
            'user_id' => auth()->id(),
            'body' => $validated['body'],
        ]);

        CourseContentUpdated::dispatchSafely($courseware->id);

        return back()->with('success', 'Comment was posted.');
    }

    public function submissions(Courseware $courseware, CourseContentItem $item): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $students = $courseware->enrollments()->with('student')->get()->pluck('student');

        $submissions = ContentItemSubmission::where('course_content_item_id', $item->id)
            ->get()
            ->keyBy('student_id');

        $itemExceptions = $item->lateExceptions()->pluck('student_id')->flip();

        // Each upload pairs with at most one quiz (course_content_items.
        // quiz_id) — the "Quiz" tab shows only that one, not every quiz
        // under the same term, so a professor grading this specific upload
        // never sees another module's quiz mixed in here.
        $quizzes = $item->quiz ? collect([$item->quiz]) : collect();

        $attemptsByQuiz = QuizAttempt::whereIn('quiz_id', $quizzes->pluck('id'))
            ->whereNotNull('submitted_at')
            ->get()
            ->groupBy('quiz_id');

        return Inertia::render('professor/courses/content-submissions', [
            'courseware' => $courseware->only(['id', 'subject']),
            'item' => [
                ...$item->only(['id', 'title']),
                'deadline' => $item->deadline?->toIso8601String(),
                'is_past_deadline' => $item->isPastDeadline(),
                'max_points' => $item->max_points,
            ],
            'rows' => $students->map(function ($student) use ($submissions, $itemExceptions) {
                $submission = $submissions->get($student->id);

                return [
                    'student_id' => $student->id,
                    'name' => $student->name,
                    'student_number' => $student->student_id,
                    'has_late_exception' => $itemExceptions->has($student->id),
                    'submission' => $submission ? [
                        'id' => $submission->id,
                        'file_url' => Storage::url($submission->file_path),
                        'file_name' => $submission->file_original_name,
                        'submitted_at' => $submission->submitted_at->toIso8601String(),
                        'acknowledged_at' => $submission->acknowledged_at?->toIso8601String(),
                        'graded_at' => $submission->graded_at?->toIso8601String(),
                        'score' => $submission->score,
                    ] : null,
                ];
            })->values(),
            'quizzes' => $quizzes->map(function (Quiz $quiz) use ($students, $attemptsByQuiz) {
                $attempts = $attemptsByQuiz->get($quiz->id, collect())->keyBy('student_id');
                $quizExceptions = $quiz->lateExceptions()->pluck('student_id')->flip();

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'deadline' => $quiz->deadline?->toIso8601String(),
                    'is_past_deadline' => $quiz->isPastDeadline(),
                    'rows' => $students->map(function ($student) use ($attempts, $quizExceptions) {
                        $attempt = $attempts->get($student->id);

                        return [
                            'student_id' => $student->id,
                            'name' => $student->name,
                            'student_number' => $student->student_id,
                            'attempted' => $attempt !== null,
                            'submitted_at' => $attempt?->submitted_at?->toIso8601String(),
                            'duration_seconds' => $attempt?->duration_seconds,
                            'score' => $attempt?->score,
                            'correct_count' => $attempt?->correct_count,
                            'total_questions' => $attempt?->total_questions,
                            'suspicious_activity_count' => $attempt?->suspicious_activity_count,
                            'has_late_exception' => $quizExceptions->has($student->id),
                        ];
                    })->values(),
                ];
            })->values(),
        ]);
    }

    public function updateSubmissionScore(Request $request, Courseware $courseware, ContentItemSubmission $submission): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($submission->item->category->courseware_id === $courseware->id, 403);

        $validated = $request->validate([
            'score' => ['nullable', 'integer', 'min:0', 'max:'.$submission->item->max_points],
        ]);

        $score = $validated['score'] ?? null;

        $submission->update([
            'score' => $score,
            'graded_at' => $score !== null ? now() : null,
        ]);

        $this->syncScoreToGradingSystem($courseware, $submission);

        CourseContentUpdated::dispatchSafely($courseware->id);

        return back()->with('success', 'Score was saved successfully.');
    }

    public function acknowledgeSubmission(Courseware $courseware, ContentItemSubmission $submission): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($submission->item->category->courseware_id === $courseware->id, 403);

        if (! $submission->acknowledged_at) {
            $submission->update(['acknowledged_at' => now()]);
        }

        CourseContentUpdated::dispatchSafely($courseware->id);

        return back()->with('success', 'Submission acknowledged.');
    }

    public function grantLateException(Courseware $courseware, CourseContentItem $item, User $student): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);
        abort_unless(
            Enrollment::where('courseware_id', $courseware->id)->where('student_id', $student->id)->exists(),
            404,
        );

        LateException::firstOrCreate(
            [
                'exceptionable_type' => CourseContentItem::class,
                'exceptionable_id' => $item->id,
                'student_id' => $student->id,
            ],
            ['granted_by' => auth()->id()],
        );

        return back()->with('success', "Late exception granted to {$student->name}.");
    }

    public function revokeLateException(Courseware $courseware, CourseContentItem $item, User $student): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        LateException::where([
            'exceptionable_type' => CourseContentItem::class,
            'exceptionable_id' => $item->id,
            'student_id' => $student->id,
        ])->delete();

        return back()->with('success', "Late exception revoked for {$student->name}.");
    }

    /**
     * Mirror a graded submission's score into the term-based grading system,
     * under whichever grading category matches the module's own work_type
     * (Assignment/Activity — e.g. an Assignment submission auto-populates
     * the "Assignments" grade item for that term). The term is always the
     * Prelims/Midterm/Finals category the item was actually uploaded into —
     * i.e. where it belongs on the calendar's schedule — never "whatever
     * term today's date happens to fall in", since a professor grading a
     * Prelims submission late (during Midterm, say) must still have it
     * count toward Prelims. Silently does nothing if that term name isn't
     * one of the three recognized terms or no matching grading category
     * exists — the professor can still grade the submission as before and
     * enter it into the gradebook manually.
     */
    private function syncScoreToGradingSystem(Courseware $courseware, ContentItemSubmission $submission): void
    {
        $term = strtolower($submission->item->category->name);

        if (! in_array($term, TermGradingService::TERMS, true)) {
            return;
        }

        $gradeCategoryName = self::WORK_TYPE_GRADE_CATEGORY_NAMES[$submission->item->work_type] ?? 'Activities';

        $categories = $this->gradingService->categoriesForTerm($courseware, $term);
        $gradeCategory = $categories->first(
            fn ($category) => strcasecmp($category->name, $gradeCategoryName) === 0,
        );

        if (! $gradeCategory) {
            return;
        }

        $gradeItem = $this->gradingService->resolveGradeItemForContentItem($gradeCategory, $submission->item);

        // The item's own total can change after the grade item already
        // exists (e.g. a professor edits the assignment's points later) —
        // keep them in sync without disturbing the item's column order.
        if ($gradeItem->max_points !== $submission->item->max_points) {
            $gradeItem->update(['max_points' => $submission->item->max_points]);
        }

        if ($submission->score === null) {
            GradeScore::where('grade_item_id', $gradeItem->id)
                ->where('student_id', $submission->student_id)
                ->delete();

            return;
        }

        GradeScore::updateOrCreate(
            ['grade_item_id' => $gradeItem->id, 'student_id' => $submission->student_id],
            ['score' => $submission->score],
        );
    }
}
