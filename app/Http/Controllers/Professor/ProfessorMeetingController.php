<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\MeetingChatMessage;
use App\Models\MeetingParticipation;
use App\Models\MeetingSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
        abort_unless($courseware->isWithinTermSchedule(), 403, 'This subject\'s term is not active — meetings are only available during the scheduled semester.');

        $meetingUrl = $courseware->meetingUrl();
        $jitsiDomain = config('services.jitsi.domain');
        $session = $courseware->activeMeetingSession();

        return Inertia::render('professor/courses/meeting', [
            'courseware' => $courseware->only(['id', 'subject']),
            'meeting' => [
                'url' => $meetingUrl,
                'domain' => $jitsiDomain,
                'room_name' => Str::afterLast($meetingUrl, '/'),
                'is_embedded' => $courseware->usesEmbeddedMeeting(),
                'is_live' => $courseware->isMeetingLive(),
                'class_start_time' => $courseware->class_start_time?->format('H:i'),
                'class_end_time' => $courseware->class_end_time?->format('H:i'),
                'session_id' => $session?->id,
                'record_mode' => $session?->record_mode,
                'recording_status' => $session?->recording_status,
            ],
        ]);
    }

    public function start(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($courseware->isWithinTermSchedule(), 403, 'This subject\'s term is not active — meetings are only available during the scheduled semester.');

        $validated = $request->validate([
            'record_mode' => ['required', Rule::in(MeetingSession::RECORD_MODES)],
        ]);

        $courseware->update(['meeting_started_at' => now()]);

        MeetingSession::create([
            'courseware_id' => $courseware->id,
            'started_by' => auth()->id(),
            'started_at' => now(),
            'record_mode' => $validated['record_mode'],
        ]);

        return back();
    }

    public function end(Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $courseware->update(['meeting_started_at' => null]);

        $session = $courseware->activeMeetingSession();

        if ($session !== null) {
            $session->participations()
                ->whereNull('left_at')
                ->update(['left_at' => now()]);

            $session->update([
                'ended_at' => now(),
                // Jitsi should already have reported the real stop via
                // recordingStatusChanged, but if the professor's browser
                // disconnected before that fired, don't leave the session
                // stuck showing "recording" forever.
                'recording_status' => $session->recording_status === 'recording'
                    ? 'stopped'
                    : $session->recording_status,
            ]);
        }

        return back();
    }

    /**
     * Everything recorded about past meetings for this subject — the
     * "container" the recording, participation times, and chat log live in.
     */
    public function records(Courseware $courseware): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $sessions = $courseware->meetingSessions()
            ->with(['participations.user:id,name', 'chatMessages.user:id,name'])
            ->orderByDesc('started_at')
            ->get()
            ->map(fn (MeetingSession $session) => [
                'id' => $session->id,
                'started_at' => $session->started_at->toIso8601String(),
                'ended_at' => $session->ended_at?->toIso8601String(),
                'record_mode' => $session->record_mode,
                'recording_status' => $session->recording_status,
                'recording_url' => $session->recording_url,
                'participations' => $session->participations
                    ->sortBy('joined_at')
                    ->values()
                    ->map(fn (MeetingParticipation $participation) => [
                        'id' => $participation->id,
                        'student_name' => $participation->user->name ?? 'Unknown',
                        'joined_at' => $participation->joined_at->toIso8601String(),
                        'left_at' => $participation->left_at?->toIso8601String(),
                        'duration_seconds' => $participation->durationSeconds(),
                    ]),
                'chat_messages' => $session->chatMessages
                    ->sortBy('sent_at')
                    ->values()
                    ->map(fn (MeetingChatMessage $message) => [
                        'id' => $message->id,
                        'author_name' => $message->user->name ?? 'Unknown',
                        'body' => $message->body,
                        'sent_at' => $message->sent_at->toIso8601String(),
                    ]),
            ]);

        return Inertia::render('professor/courses/meeting-records', [
            'courseware' => $courseware->only(['id', 'subject']),
            'sessions' => $sessions,
        ]);
    }

    public function attachRecordingUrl(Request $request, Courseware $courseware, MeetingSession $session): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($session->courseware_id === $courseware->id, 404);

        $validated = $request->validate([
            'recording_url' => ['required', 'url', 'max:2048'],
        ]);

        $session->update([
            'recording_url' => $validated['recording_url'],
            'recording_status' => 'stopped',
        ]);

        return back()->with('success', 'Recording link was saved.');
    }
}
