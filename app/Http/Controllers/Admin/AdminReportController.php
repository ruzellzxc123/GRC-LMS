<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Courseware;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    public function index(Request $request): Response
    {
        $reports = Courseware::query()
            ->withCount('enrollments')
            ->get()
            ->map(function (Courseware $course) {
                $attendanceRate = Attendance::query()
                    ->whereHas('enrollment', function ($query) use ($course): void {
                        $query->where('courseware_id', $course->id);
                    })
                    ->selectRaw("avg(status = 'present') * 100 as rate")
                    ->value('rate');

                $quizAverage = QuizAttempt::query()
                    ->whereHas('quiz', function ($query) use ($course): void {
                        $query->where('courseware_id', $course->id);
                    })
                    ->whereNotNull('submitted_at')
                    ->get(['total_questions', 'correct_count'])
                    ->avg(fn (QuizAttempt $attempt) => $attempt->total_questions > 0
                        ? $attempt->correct_count / $attempt->total_questions * 100
                        : null);

                return [
                    'id' => $course->id,
                    'title' => $course->subject.($course->course_code ? " ({$course->course_code})" : ''),
                    'summary' => sprintf(
                        '%d students enrolled · %s avg attendance · %s avg quiz score',
                        $course->enrollments_count,
                        $attendanceRate !== null ? round($attendanceRate).'%' : 'no data',
                        $quizAverage !== null ? round($quizAverage).'%' : 'no data',
                    ),
                    'generated_at' => now()->toDateString(),
                ];
            });

        return Inertia::render('admin/reports/index', [
            'reports' => $reports,
        ]);
    }
}
