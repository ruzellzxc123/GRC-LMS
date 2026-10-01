<?php

namespace App\Http\Controllers\Professor;

use App\Events\CourseContentUpdated;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Courseware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorAttendanceController extends Controller
{
    public function index(Courseware $courseware, Request $request): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $dates = $this->classDates($courseware);
        $availableDates = $dates->reject(fn (array $date) => $date['is_future']);

        $requestedDate = $request->query('date');
        $selectedDate = ($requestedDate && $availableDates->contains('value', $requestedDate))
            ? $requestedDate
            : ($availableDates->last()['value'] ?? today()->toDateString());

        $roster = $courseware->enrollments()
            ->with([
                'student',
                'attendances' => function ($query) use ($selectedDate): void {
                    $query->where('date', $selectedDate);
                },
            ])
            ->get()
            ->map(fn ($enrollment) => [
                'enrollment_id' => $enrollment->id,
                'student' => $enrollment->student->only(['id', 'name', 'email', 'student_id']),
                'status' => $enrollment->attendances->first()?->status,
            ]);

        return Inertia::render('professor/attendance', [
            'courseware' => $courseware->only(['id', 'subject']),
            'date' => $selectedDate,
            'roster' => $roster,
            'class_day' => $courseware->class_day,
            'class_start_time' => $courseware->class_start_time?->format('g:i A'),
            'class_end_time' => $courseware->class_end_time?->format('g:i A'),
            'dates' => $dates,
            'can_mark' => $this->canMarkNow($courseware, $selectedDate),
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

        if (! $this->canMarkNow($courseware, $validated['date'])) {
            return back()->withErrors([
                'date' => $this->cannotMarkReason($courseware, $validated['date']),
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

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.attendance.index', [
            'courseware' => $courseware,
            'date' => $validated['date'],
        ])->with('success', 'Attendance was saved successfully.');
    }

    /**
     * Every occurrence of the subject's class day across the whole academic
     * term — including sessions still to come, so the professor can see the
     * full schedule at a glance. Dates beyond today are flagged `is_future`
     * so the UI can list them without letting them be clicked; a professor
     * can't take attendance for a session that hasn't happened yet. Empty
     * when the subject has no class day or no academic term to bound the
     * range.
     */
    private function classDates(Courseware $courseware): Collection
    {
        $term = $courseware->academicTerm;

        if ($courseware->class_day === null || $term === null) {
            return collect();
        }

        $today = today();

        $recordedDates = Attendance::whereHas(
            'enrollment',
            fn ($query) => $query->where('courseware_id', $courseware->id),
        )
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->unique();

        $dates = collect();
        $cursor = $term->start_date;

        while ($cursor->lte($term->end_date)) {
            if ($cursor->format('l') === $courseware->class_day) {
                $value = $cursor->toDateString();

                $dates->push([
                    'value' => $value,
                    'label' => $cursor->format('M j, Y'),
                    'is_today' => $value === $today->toDateString(),
                    'is_future' => $cursor->gt($today),
                    'has_records' => $recordedDates->contains($value),
                ]);
            }

            $cursor = $cursor->addDay();
        }

        return $dates->values();
    }

    /**
     * Attendance can only ever be marked live, during the subject's actual
     * class window on its actual class day — never in advance for a future
     * session, and never after the fact once that day's window has closed.
     */
    private function canMarkNow(Courseware $courseware, string $date): bool
    {
        if ($date !== today()->toDateString()) {
            return false;
        }

        if (! $this->isScheduledDay($courseware, $date)) {
            return false;
        }

        return $courseware->classScheduleState() === 'in_window';
    }

    private function cannotMarkReason(Courseware $courseware, string $date): string
    {
        if (! $this->isScheduledDay($courseware, $date)) {
            return "This subject only meets on {$courseware->class_day} — attendance can't be recorded on any other day.";
        }

        if ($date !== today()->toDateString()) {
            return 'Attendance can only be taken on the day of class, during class hours — not in advance and not after the fact.';
        }

        return $courseware->class_start_time && $courseware->class_end_time
            ? "Attendance can only be taken between {$courseware->class_start_time->format('g:i A')} and {$courseware->class_end_time->format('g:i A')}."
            : 'This subject has no class time set — ask an admin to configure one before taking attendance.';
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
