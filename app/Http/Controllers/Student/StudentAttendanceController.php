<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Inertia\Inertia;
use Inertia\Response;

class StudentAttendanceController extends Controller
{
    public function index(): Response
    {
        $enrollments = Enrollment::query()
            ->where('student_id', auth()->id())
            ->with(['courseware', 'attendances'])
            ->get()
            ->sortBy(fn (Enrollment $enrollment) => $enrollment->courseware->subject)
            ->values();

        $subjects = $enrollments->map(function (Enrollment $enrollment) {
            $attendances = $enrollment->attendances;
            $total = $attendances->count();
            $present = $attendances->where('status', 'present')->count();

            return [
                'courseware_id' => $enrollment->courseware->id,
                'subject' => $enrollment->courseware->subject,
                'present' => $present,
                'absent' => $attendances->where('status', 'absent')->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'excused' => $attendances->where('status', 'excused')->count(),
                'total' => $total,
                'rate' => $total > 0 ? round($present / $total * 100, 1) : null,
                'records' => $attendances
                    ->sortByDesc('date')
                    ->values()
                    ->map(fn ($attendance) => [
                        'date' => $attendance->date,
                        'status' => $attendance->status,
                        'remarks' => $attendance->remarks,
                    ]),
            ];
        });

        return Inertia::render('student/attendance/index', [
            'subjects' => $subjects,
        ]);
    }
}
