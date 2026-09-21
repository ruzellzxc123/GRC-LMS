<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Feedback;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $enrollments = Enrollment::query()
            ->with(['student', 'courseware'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'type' => 'enrollment',
                'title' => "{$enrollment->student->name} enrolled in {$enrollment->courseware->subject}",
                'occurred_at' => $enrollment->created_at,
            ]);

        $feedback = Feedback::query()
            ->with(['professor', 'student'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Feedback $item) => [
                'type' => 'feedback',
                'title' => "{$item->professor->name} sent feedback to {$item->student->name}",
                'occurred_at' => $item->created_at,
            ]);

        $attempts = QuizAttempt::query()
            ->whereNotNull('submitted_at')
            ->with(['student', 'quiz'])
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'type' => 'quiz_attempt',
                'title' => "{$attempt->student->name} completed \"{$attempt->quiz->title}\" ({$attempt->score}%)",
                'occurred_at' => $attempt->submitted_at,
            ]);

        $activities = $enrollments
            ->concat($feedback)
            ->concat($attempts)
            ->sortByDesc('occurred_at')
            ->take(15)
            ->values();

        return Inertia::render('admin/activities/index', [
            'activities' => $activities,
        ]);
    }
}
