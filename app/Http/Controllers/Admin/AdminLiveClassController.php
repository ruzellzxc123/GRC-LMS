<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminLiveClassController extends Controller
{
    /**
     * Every subject with a meeting currently in progress, across every
     * professor — the admin's oversight entry point into live classes.
     */
    public function index(): Response
    {
        $liveClasses = Courseware::query()
            ->whereNotNull('meeting_started_at')
            ->active()
            ->with(['professorAccount:id,name', 'department:id,name'])
            ->orderBy('meeting_started_at')
            ->get();

        return Inertia::render('admin/live-classes/index', [
            'classes' => $liveClasses->map(fn (Courseware $course) => [
                'id' => $course->id,
                'subject' => $course->subject,
                'professor_name' => $course->professorAccount->name ?? $course->professor,
                'department' => $course->department?->name,
                'started_at' => $course->meeting_started_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Join a live class as a silent observer — never a moderator, and
     * never counted in student attendance/participation records, since
     * this is oversight, not class participation.
     */
    public function show(Courseware $courseware): Response
    {
        abort_unless($courseware->isMeetingLive(), 404);

        $meetingUrl = $courseware->meetingUrl();

        return Inertia::render('admin/live-classes/show', [
            'courseware' => $courseware->only(['id', 'subject']),
            'meeting' => [
                'domain' => config('services.jitsi.domain'),
                'room_name' => Str::afterLast($meetingUrl, '/'),
                'is_embedded' => $courseware->usesEmbeddedMeeting(),
            ],
        ]);
    }
}
