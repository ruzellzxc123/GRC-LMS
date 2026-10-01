<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\ClassReport;
use App\Models\ClassReportScreenshot;
use App\Models\Courseware;
use App\Models\MeetingSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorReportController extends Controller
{
    /** How far back a just-missed class still shows up as reportable. */
    private const WINDOW_PAST_DAYS = 3;

    /** How far ahead upcoming classes are listed. */
    private const WINDOW_FUTURE_DAYS = 14;

    public function index(): Response
    {
        $professorId = auth()->id();

        $courses = Courseware::query()
            ->where('professor_id', $professorId)
            ->active()
            ->whereNotNull('class_day')
            ->with('academicTerm')
            ->get();

        $existingReports = ClassReport::query()
            ->where('professor_id', $professorId)
            ->get(['id', 'courseware_id', 'class_date'])
            ->keyBy(fn (ClassReport $report) => $report->courseware_id.'|'.$report->class_date->format('Y-m-d'));

        $today = Carbon::now()->startOfDay();
        $windowStart = $today->copy()->subDays(self::WINDOW_PAST_DAYS);
        $windowEnd = $today->copy()->addDays(self::WINDOW_FUTURE_DAYS);

        $occurrences = collect();

        foreach ($courses as $course) {
            foreach ($this->occurrenceDatesFor($course, $windowStart, $windowEnd) as $date) {
                $existing = $existingReports->get($course->id.'|'.$date->format('Y-m-d'));

                $occurrences->push([
                    'courseware_id' => $course->id,
                    'subject' => $course->subject,
                    'date' => $date->format('Y-m-d'),
                    'day_label' => $date->format('l, F j, Y'),
                    'is_today' => $date->isSameDay($today),
                    'is_past' => $date->lt($today),
                    'report_id' => $existing?->id,
                    'submitted' => $existing !== null,
                ]);
            }
        }

        return Inertia::render('professor/reports/index', [
            'occurrences' => $occurrences->sortBy('date')->values(),
        ]);
    }

    public function show(Courseware $courseware, string $date): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $classDate = Carbon::parse($date)->startOfDay();

        $report = ClassReport::query()
            ->where('courseware_id', $courseware->id)
            ->where('class_date', $classDate->format('Y-m-d'))
            ->with('screenshots')
            ->first();

        $session = $report !== null && $report->meeting_session_id !== null
            ? $report->meetingSession
            : $this->sessionForDate($courseware, $classDate);

        return Inertia::render('professor/reports/show', [
            'courseware' => $courseware->only(['id', 'subject']),
            'class_date' => $classDate->format('Y-m-d'),
            'day_label' => $classDate->format('l, F j, Y'),
            'report' => $report ? [
                'id' => $report->id,
                'video_url' => $report->video_path ? Storage::url($report->video_path) : null,
                'submitted_at' => $report->submitted_at->toIso8601String(),
                'screenshots' => $report->screenshots->map(fn (ClassReportScreenshot $screenshot) => [
                    'id' => $screenshot->id,
                    'url' => Storage::url($screenshot->file_path),
                ]),
            ] : null,
            'session_found' => $session !== null,
            'participants' => $session?->participantSummaries() ?? collect(),
        ]);
    }

    public function store(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'class_date' => ['required', 'date'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo', 'max:1048576'],
            'screenshots' => ['nullable', 'array', 'max:10'],
            'screenshots.*' => ['file', 'image', 'max:10240'],
        ]);

        $classDate = Carbon::parse($validated['class_date'])->startOfDay();
        $session = $this->sessionForDate($courseware, $classDate);

        $report = ClassReport::updateOrCreate(
            [
                'courseware_id' => $courseware->id,
                'class_date' => $classDate->format('Y-m-d'),
            ],
            [
                'professor_id' => auth()->id(),
                'meeting_session_id' => $session?->id,
                'submitted_at' => now(),
            ],
        );

        if ($request->hasFile('video')) {
            if ($report->video_path) {
                Storage::disk('public')->delete($report->video_path);
            }

            $report->update([
                'video_path' => $request->file('video')->store('class-reports/videos', 'public'),
            ]);
        }

        foreach ($request->file('screenshots', []) as $screenshot) {
            ClassReportScreenshot::create([
                'class_report_id' => $report->id,
                'file_path' => $screenshot->store('class-reports/screenshots', 'public'),
            ]);
        }

        return Redirect::route('professor.reports.show', [$courseware, $classDate->format('Y-m-d')])
            ->with('success', 'Class report submitted.');
    }

    public function destroyScreenshot(ClassReportScreenshot $screenshot): RedirectResponse
    {
        abort_unless($screenshot->report->courseware->professor_id === auth()->id(), 403);

        Storage::disk('public')->delete($screenshot->file_path);
        $screenshot->delete();

        return back()->with('success', 'Screenshot removed.');
    }

    /**
     * @return array<int, Carbon>
     */
    private function occurrenceDatesFor(Courseware $course, Carbon $windowStart, Carbon $windowEnd): array
    {
        $days = array_values(array_filter([$course->class_day, $course->class_day_2]));

        if ($days === []) {
            return [];
        }

        $start = $windowStart->copy();
        $end = $windowEnd->copy();

        if ($course->academicTerm !== null) {
            $start = $start->max(Carbon::parse($course->academicTerm->start_date));
            $end = $end->min(Carbon::parse($course->academicTerm->end_date));
        }

        $dates = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            if (in_array($cursor->format('l'), $days, true)) {
                $dates[] = $cursor->copy();
            }

            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    private function sessionForDate(Courseware $courseware, Carbon $date): ?MeetingSession
    {
        return MeetingSession::query()
            ->where('courseware_id', $courseware->id)
            ->whereDate('started_at', $date->format('Y-m-d'))
            ->latest('started_at')
            ->first();
    }
}
