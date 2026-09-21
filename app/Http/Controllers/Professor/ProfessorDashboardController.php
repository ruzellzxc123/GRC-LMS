<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\Feedback;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\PerformancePredictionService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorDashboardController extends Controller
{
    public function __construct(
        private readonly PerformancePredictionService $performancePredictionService,
    ) {}

    public function __invoke(): Response
    {
        $professor = Auth::user();

        $courses = Courseware::query()
            ->where('professor_id', $professor->id)
            ->with('academicTerm')
            ->withCount('enrollments')
            ->get();

        $rosterCount = Enrollment::query()
            ->whereHas('courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->count();

        $recentFeedbackSent = Feedback::query()
            ->where('professor_id', $professor->id)
            ->with('student')
            ->latest()
            ->limit(5)
            ->get();

        $quizCount = Quiz::query()
            ->whereHas('courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->count();

        $prediction = $this->performancePredictionService->predictForProfessor($professor);

        $courseScores = $courses->map(function (Courseware $course) {
            $attempts = QuizAttempt::query()
                ->whereHas('quiz', fn ($query) => $query->where('courseware_id', $course->id))
                ->whereNotNull('submitted_at')
                ->get(['total_questions', 'correct_count']);

            $average = $attempts->isNotEmpty()
                ? round($attempts->avg(fn (QuizAttempt $attempt) => $attempt->score), 1)
                : null;

            return [
                'id' => $course->id,
                'subject' => $course->subject,
                'average_score' => $average,
            ];
        });

        $pendingSubmissions = ContentItemSubmission::query()
            ->whereNull('graded_at')
            ->whereHas('item.category.courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->with(['student:id,name', 'item.category.courseware'])
            ->oldest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn (ContentItemSubmission $submission) => [
                'id' => $submission->id,
                'student_name' => $submission->student->name,
                'item_title' => $submission->item->title,
                'courseware_id' => $submission->item->category->courseware_id,
                'item_id' => $submission->item->id,
                'subject' => $submission->item->category->courseware->subject,
                'submitted_at' => $submission->submitted_at->toIso8601String(),
            ]);

        $pendingGradingCount = ContentItemSubmission::query()
            ->whereNull('graded_at')
            ->whereHas('item.category.courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->count();

        $recentAttempts = QuizAttempt::query()
            ->whereHas('quiz.courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->whereNotNull('submitted_at')
            ->with(['student:id,name', 'quiz'])
            ->latest('submitted_at')
            ->limit(5)
            ->get();

        $recentGraded = ContentItemSubmission::query()
            ->whereNotNull('graded_at')
            ->whereHas('item.category.courseware', fn ($query) => $query->where('professor_id', $professor->id))
            ->with('student:id,name')
            ->latest('graded_at')
            ->limit(5)
            ->get();

        $activity = collect()
            ->concat($recentFeedbackSent->map(fn (Feedback $feedback) => [
                'type' => 'feedback',
                'title' => "Feedback sent to {$feedback->student->name}",
                'meta' => null,
                'at' => $feedback->created_at,
            ]))
            ->concat($recentAttempts->map(fn (QuizAttempt $attempt) => [
                'type' => 'quiz',
                'title' => "{$attempt->student->name} completed \"{$attempt->quiz->title}\"",
                'meta' => "{$attempt->score}%",
                'at' => $attempt->submitted_at,
            ]))
            ->concat($recentGraded->map(fn (ContentItemSubmission $submission) => [
                'type' => 'grade',
                'title' => "Graded submission for {$submission->student->name}",
                'meta' => $submission->score !== null ? "{$submission->score}%" : null,
                'at' => $submission->graded_at,
            ]))
            ->sortByDesc('at')
            ->take(6)
            ->values()
            ->map(fn (array $entry) => [...$entry, 'at' => $entry['at']->toIso8601String()]);

        return Inertia::render('professor/dashboard', [
            'stats' => [
                'course_count' => $courses->count(),
                'student_count' => $rosterCount,
                'quiz_count' => $quizCount,
                'pending_grading_count' => $pendingGradingCount,
            ],
            'prediction' => [
                'professor_index' => $prediction['professor_index'],
                'at_risk_enrollment_count' => $prediction['at_risk_enrollment_count'],
            ],
            'course_scores' => $courseScores,
            'pending_submissions' => $pendingSubmissions,
            'recent_activity' => $activity,
            'courses' => $courses->map(fn (Courseware $course) => [
                'id' => $course->id,
                'subject' => $course->subject,
                'module_title' => $course->module_title,
                'enrollments_count' => $course->enrollments_count,
                'meeting_link' => $course->meetingUrl(),
                'uses_embedded_meeting' => $course->usesEmbeddedMeeting(),
                'today_hyflex_mode' => $course->todaysHyflexMode(),
            ]),
        ]);
    }
}
