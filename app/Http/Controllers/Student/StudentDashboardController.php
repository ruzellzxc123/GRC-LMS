<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
use App\Models\ContentItemView;
use App\Models\Enrollment;
use App\Models\Feedback;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\PerformancePredictionService;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    public function __construct(
        private readonly PerformancePredictionService $performancePredictionService,
    ) {}

    public function __invoke(): Response
    {
        $student = auth()->user();

        $enrollments = Enrollment::query()
            ->where('student_id', $student->id)
            ->with('courseware')
            ->get();

        $coursewareIds = $enrollments->pluck('courseware_id');

        $pendingQuizzes = Quiz::query()
            ->where('is_published', true)
            ->whereIn('courseware_id', $coursewareIds)
            ->whereDoesntHave('attempts', fn ($query) => $query->where('student_id', $student->id))
            ->with('courseware')
            ->get()
            ->sortBy(fn (Quiz $quiz) => $quiz->deadline?->timestamp ?? PHP_INT_MAX)
            ->values();

        $recentFeedback = Feedback::query()
            ->where('student_id', $student->id)
            ->with('professor')
            ->latest()
            ->limit(5)
            ->get();

        $prediction = $this->performancePredictionService->predictForStudent($student);

        $quizAttempts = QuizAttempt::query()
            ->where('student_id', $student->id)
            ->whereNotNull('submitted_at')
            ->with('quiz')
            ->orderBy('submitted_at')
            ->get();

        $weekStart = now()->startOfWeek();

        $contentMinutesThisWeek = ContentItemView::query()
            ->where('student_id', $student->id)
            ->whereNotNull('finished_at')
            ->where('finished_at', '>=', $weekStart)
            ->get()
            ->sum(fn (ContentItemView $view) => $view->started_at->diffInMinutes($view->finished_at));

        $quizMinutesThisWeek = $quizAttempts
            ->filter(fn (QuizAttempt $attempt) => $attempt->submitted_at->gte($weekStart))
            ->sum(fn (QuizAttempt $attempt) => (int) round(($attempt->duration_seconds ?? 0) / 60));

        $gradedSubmissions = ContentItemSubmission::query()
            ->where('student_id', $student->id)
            ->whereNotNull('graded_at')
            ->with('item')
            ->latest('graded_at')
            ->limit(5)
            ->get();

        $activity = collect()
            ->concat($quizAttempts->sortByDesc('submitted_at')->take(5)->map(fn (QuizAttempt $attempt) => [
                'type' => 'quiz',
                'title' => "Completed \"{$attempt->quiz->title}\"",
                'meta' => "{$attempt->score}%",
                'at' => $attempt->submitted_at,
            ]))
            ->concat($recentFeedback->map(fn (Feedback $feedback) => [
                'type' => 'feedback',
                'title' => "Feedback from {$feedback->professor->name}",
                'meta' => null,
                'at' => $feedback->created_at,
            ]))
            ->concat($gradedSubmissions->map(fn (ContentItemSubmission $submission) => [
                'type' => 'grade',
                'title' => "Graded: {$submission->item->title}",
                'meta' => "{$submission->score}%",
                'at' => $submission->graded_at,
            ]))
            ->sortByDesc('at')
            ->take(6)
            ->values()
            ->map(fn (array $entry) => [...$entry, 'at' => $entry['at']->toIso8601String()]);

        return Inertia::render('student/dashboard', [
            'stats' => [
                'course_count' => $enrollments->count(),
                'attendance_rate' => $prediction['attendance_rate'],
                'pending_quiz_count' => $pendingQuizzes->count(),
                'study_minutes_this_week' => $contentMinutesThisWeek + $quizMinutesThisWeek,
            ],
            'prediction' => [
                'composite_score' => $prediction['composite_score'],
                'label' => $prediction['label'],
                'risk_level' => $prediction['risk_level'],
                'attendance_rate' => $prediction['attendance_rate'],
                'quiz_average' => $prediction['quiz_average'],
                'flags' => $prediction['flags'],
            ],
            'performance_trend' => $quizAttempts->take(-8)->values()->map(fn (QuizAttempt $attempt) => [
                'label' => $attempt->quiz->title,
                'score' => $attempt->score,
                'date' => $attempt->submitted_at->toDateString(),
            ]),
            'pending_quizzes' => $pendingQuizzes->take(3)->map(fn (Quiz $quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'course_subject' => $quiz->courseware->subject,
                'deadline' => $quiz->deadline?->toIso8601String(),
            ])->values(),
            'recent_activity' => $activity,
        ]);
    }
}
