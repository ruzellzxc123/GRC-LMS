<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use Inertia\Inertia;
use Inertia\Response;

class StudentScoreController extends Controller
{
    public function index(): Response
    {
        $enrollments = Enrollment::query()
            ->where('student_id', auth()->id())
            ->with('courseware')
            ->get()
            ->sortBy(fn (Enrollment $enrollment) => $enrollment->courseware->subject)
            ->values();

        $attempts = QuizAttempt::query()
            ->where('student_id', auth()->id())
            ->whereNotNull('submitted_at')
            ->whereHas('quiz', function ($query) use ($enrollments): void {
                $query->whereIn('courseware_id', $enrollments->pluck('courseware_id'));
            })
            ->with('quiz')
            ->get();

        $subjects = $enrollments->map(function (Enrollment $enrollment) use ($attempts) {
            $subjectAttempts = $attempts->filter(
                fn (QuizAttempt $attempt) => $attempt->quiz->courseware_id === $enrollment->courseware_id,
            );

            return [
                'courseware_id' => $enrollment->courseware->id,
                'subject' => $enrollment->courseware->subject,
                'average_score' => $subjectAttempts->isNotEmpty()
                    ? round($subjectAttempts->avg('score'), 1)
                    : null,
                'quizzes' => $subjectAttempts
                    ->sortByDesc('submitted_at')
                    ->values()
                    ->map(fn (QuizAttempt $attempt) => [
                        'title' => $attempt->quiz->title,
                        'score' => $attempt->score,
                        'submitted_at' => $attempt->submitted_at,
                    ]),
            ];
        });

        return Inertia::render('student/scores/index', [
            'subjects' => $subjects,
        ]);
    }
}
