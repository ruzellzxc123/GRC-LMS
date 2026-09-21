<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Courseware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorAttendanceController extends Controller
{
    public function index(Courseware $courseware, Request $request): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $date = $request->query('date', now()->toDateString());

        $roster = $courseware->enrollments()
            ->with([
                'student',
                'attendances' => function ($query) use ($date): void {
                    $query->where('date', $date);
                },
            ])
            ->get()
            ->map(fn ($enrollment) => [
                'enrollment_id' => $enrollment->id,
                'student' => $enrollment->student->only(['id', 'name', 'email', 'student_id']),
                'status' => $enrollment->attendances->first()?->status,
            ]);

        return Inertia::render('professor/attendance', [
            'courseware' => $courseware->only(['id', 'subject', 'course_code']),
            'date' => $date,
            'roster' => $roster,
            'class_day' => $courseware->class_day,
            'is_scheduled_day' => $this->isScheduledDay($courseware, $date),
        ]);
    }

    public function store(Courseware $courseware, Request $request): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.enrollment_id' => [
                'required',
                Rule::exists('enrollments', 'id')->where('courseware_id', $courseware->id),
            ],
            'records.*.status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
        ]);

        if (! $this->isScheduledDay($courseware, $validated['date'])) {
            return back()->withErrors([
                'date' => "This subject only meets on {$courseware->class_day} — attendance can't be recorded on any other day.",
            ]);
        }

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'enrollment_id' => $record['enrollment_id'],
                    'date' => $validated['date'],
                ],
                [
                    'status' => $record['status'],
                    'marked_by_id' => auth()->id(),
                ],
            );
        }

        return Redirect::route('professor.attendance.index', [
            'courseware' => $courseware,
            'date' => $validated['date'],
        ])->with('success', 'Attendance was saved successfully.');
    }

    /**
     * A subject with no class day set has no schedule to violate, so
     * attendance stays unrestricted for it — mirrors how a missing class
     * schedule is treated elsewhere (Courseware::classScheduleState()).
     */
    private function isScheduledDay(Courseware $courseware, string $date): bool
    {
        if ($courseware->class_day === null) {
            return true;
        }

        return Carbon::parse($date)->format('l') === $courseware->class_day;
    }
}
