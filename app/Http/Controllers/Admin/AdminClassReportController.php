<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassReport;
use App\Models\ClassReportScreenshot;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminClassReportController extends Controller
{
    /**
     * Every professor who has submitted at least one class report, with a
     * count — the entry point into the drill-down (professor -> their
     * submitted reports -> one report's video, screenshots, and attendance).
     */
    public function professors(): Response
    {
        $professors = User::query()
            ->where('role', 'professor')
            ->withCount('classReports')
            ->having('class_reports_count', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department']);

        return Inertia::render('admin/class-reports/professors', [
            'professors' => $professors->map(fn (User $professor) => [
                'id' => $professor->id,
                'name' => $professor->name,
                'email' => $professor->email,
                'department' => $professor->department,
                'class_reports_count' => $professor->class_reports_count,
            ]),
        ]);
    }

    /**
     * One professor's submitted class reports.
     */
    public function reports(User $professor): Response
    {
        abort_unless($professor->role === 'professor', 404);

        $reports = ClassReport::query()
            ->where('professor_id', $professor->id)
            ->with(['courseware', 'screenshots'])
            ->orderByDesc('class_date')
            ->get();

        return Inertia::render('admin/class-reports/reports', [
            'professor' => $professor->only(['id', 'name', 'email']),
            'reports' => $reports->map(fn (ClassReport $report) => [
                'id' => $report->id,
                'subject' => $report->courseware->subject,
                'class_date' => $report->class_date->format('Y-m-d'),
                'submitted_at' => $report->submitted_at->toIso8601String(),
                'has_video' => $report->video_path !== null,
                'screenshot_count' => $report->screenshots->count(),
                'has_session' => $report->meeting_session_id !== null,
            ]),
        ]);
    }

    /**
     * One report's full detail — video, screenshots, and the attendance
     * summary pulled from the meeting session it was submitted against.
     */
    public function show(ClassReport $report): Response
    {
        $report->load(['courseware', 'professor', 'screenshots']);

        return Inertia::render('admin/class-reports/show', [
            'report' => [
                'id' => $report->id,
                'class_date' => $report->class_date->format('Y-m-d'),
                'day_label' => $report->class_date->format('l, F j, Y'),
                'submitted_at' => $report->submitted_at->toIso8601String(),
                'subject' => $report->courseware->subject,
                'professor_id' => $report->professor_id,
                'professor_name' => $report->professor->name,
                'video_url' => $report->video_path ? Storage::url($report->video_path) : null,
                'screenshots' => $report->screenshots->map(fn (ClassReportScreenshot $screenshot) => [
                    'id' => $screenshot->id,
                    'url' => Storage::url($screenshot->file_path),
                ]),
            ],
            'session_found' => $report->meeting_session_id !== null,
            'participants' => $report->participantSummaries(),
        ]);
    }
}
