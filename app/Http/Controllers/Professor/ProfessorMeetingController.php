<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorMeetingController extends Controller
{
    public function update(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'meeting_link' => ['nullable', 'url', 'max:255'],
        ]);

        $courseware->update($validated);

        return back()->with('success', 'Meeting link was saved successfully.');
    }

    public function show(Courseware $courseware): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $meetingUrl = $courseware->meetingUrl();

        return Inertia::render('professor/courses/meeting', [
            'courseware' => $courseware->only(['id', 'subject', 'course_code']),
            'meeting' => [
                'url' => $meetingUrl,
                'domain' => 'meet.jit.si',
                'room_name' => Str::after($meetingUrl, 'meet.jit.si/'),
                'is_embedded' => $courseware->usesEmbeddedMeeting(),
                'is_live' => $courseware->isMeetingLive(),
                'class_start_time' => $courseware->class_start_time?->format('H:i'),
                'class_end_time' => $courseware->class_end_time?->format('H:i'),
            ],
        ]);
    }

    public function start(Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $courseware->update(['meeting_started_at' => now()]);

        return back();
    }

    public function end(Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $courseware->update(['meeting_started_at' => null]);

        return back();
    }
}
