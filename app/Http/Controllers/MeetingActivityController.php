<?php

namespace App\Http\Controllers;

use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\MeetingChatMessage;
use App\Models\MeetingParticipation;
use App\Models\MeetingSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Shared by both the professor and student embedded meeting pages (they
 * render the same JitsiMeeting component) — every participant reports their
 * own join/leave/chat activity for whichever session is currently live on
 * the subject. Identity always comes from auth()->id() server-side, never
 * from the request body.
 */
class MeetingActivityController extends Controller
{
    public function join(Courseware $courseware): RedirectResponse
    {
        $this->authorizeParticipant($courseware);

        $session = $courseware->activeMeetingSession();

        if ($session !== null) {
            MeetingParticipation::create([
                'meeting_session_id' => $session->id,
                'user_id' => auth()->id(),
                'joined_at' => now(),
            ]);
        }

        return back();
    }

    public function leave(Courseware $courseware): RedirectResponse
    {
        $this->authorizeParticipant($courseware);

        $session = $courseware->activeMeetingSession();

        if ($session !== null) {
            $session->participations()
                ->where('user_id', auth()->id())
                ->whereNull('left_at')
                ->latest('joined_at')
                ->first()
                ?->update(['left_at' => now()]);
        }

        return back();
    }

    public function chat(Request $request, Courseware $courseware): RedirectResponse
    {
        $this->authorizeParticipant($courseware);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $session = $courseware->activeMeetingSession();

        if ($session !== null) {
            MeetingChatMessage::create([
                'meeting_session_id' => $session->id,
                'user_id' => auth()->id(),
                'body' => $validated['body'],
                'sent_at' => now(),
            ]);
        }

        return back();
    }

    /**
     * Only the moderator's browser can actually trigger a recording, but
     * Jitsi's recordingStatusChanged event fires for every participant —
     * any of them reporting it is fine, since this only ever reflects what
     * Jitsi itself already did (and whether Jibri was even available to do
     * it), never a client-side assumption.
     */
    public function recordingStatus(Request $request, Courseware $courseware): RedirectResponse
    {
        $this->authorizeParticipant($courseware);

        $validated = $request->validate([
            'status' => ['required', Rule::in(MeetingSession::RECORDING_STATUSES)],
        ]);

        $session = $courseware->activeMeetingSession();

        if ($session !== null) {
            $session->update([
                'recording_status' => $validated['status'],
                'recording_started_at' => $validated['status'] === 'recording'
                    ? now()
                    : $session->recording_started_at,
                'recording_ended_at' => $validated['status'] === 'stopped'
                    ? now()
                    : $session->recording_ended_at,
            ]);
        }

        return back();
    }

    private function authorizeParticipant(Courseware $courseware): void
    {
        $isOwningProfessor = $courseware->professor_id === auth()->id();

        $isEnrolledStudent = Enrollment::query()
            ->where('courseware_id', $courseware->id)
            ->where('student_id', auth()->id())
            ->exists();

        abort_unless($isOwningProfessor || $isEnrolledStudent, 403);
    }
}
