<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\CalendarAnnouncement;
use App\Models\Courseware;
use App\Models\Quiz;
use App\Services\StudentNotificationService;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(private readonly StudentNotificationService $notifications) {}

    public function index(): Response
    {
        $user = auth()->user();

        $terms = AcademicTerm::query()
            ->orderByDesc('start_date')
            ->get([
                'id',
                'name',
                'start_date',
                'end_date',
                'prelims_start',
                'prelims_end',
                'midterm_start',
                'midterm_end',
                'finals_start',
                'finals_end',
                'hyflex_first_f2f_group',
            ]);

        $pendingDeadlines = $this->notifications->pendingQuizDeadlines($user)
            ->map(fn (Quiz $quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'subject' => $quiz->courseware->subject,
                'date' => $quiz->deadline->format('Y-m-d'),
                'deadline' => $quiz->deadline->toIso8601String(),
            ])
            ->values();

        // Only a professor needs their own weekly class schedule surfaced on
        // the calendar — everyone else gets an empty list at no extra query.
        $myClasses = $user->role === 'professor'
            ? Courseware::query()
                ->where('professor_id', $user->id)
                ->whereNotNull('class_day')
                ->get(['id', 'subject', 'class_day', 'class_start_time', 'class_end_time'])
                ->map(fn (Courseware $course) => [
                    'id' => $course->id,
                    'subject' => $course->subject,
                    'class_day' => $course->class_day,
                    'class_start_time' => $course->class_start_time?->format('H:i'),
                    'class_end_time' => $course->class_end_time?->format('H:i'),
                ])
                ->values()
            : collect();

        $announcements = CalendarAnnouncement::query()
            ->orderBy('date')
            ->get(['id', 'date', 'title', 'description'])
            ->map(fn (CalendarAnnouncement $announcement) => [
                'id' => $announcement->id,
                'date' => $announcement->date->format('Y-m-d'),
                'title' => $announcement->title,
                'description' => $announcement->description,
            ]);

        return Inertia::render('shared/calendar', [
            'terms' => $terms,
            'pending_deadlines' => $pendingDeadlines,
            'my_classes' => $myClasses,
            'announcements' => $announcements,
        ]);
    }
}
