<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class MeetingSession extends Model
{
    public const RECORD_MODES = ['auto', 'manual'];

    /**
     * 'recording' and 'stopped' are confirmed by Jitsi's own
     * recordingStatusChanged event, not assumed client-side — see
     * MeetingActivityController::recordingStatus(). 'unavailable' means
     * Jitsi reported an error starting the recorder (e.g. no Jibri running).
     */
    public const RECORDING_STATUSES = ['not_recording', 'recording', 'stopped', 'unavailable'];

    protected $fillable = [
        'courseware_id',
        'started_by',
        'started_at',
        'ended_at',
        'record_mode',
        'recording_status',
        'recording_started_at',
        'recording_ended_at',
        'recording_url',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'recording_started_at' => 'datetime',
            'recording_ended_at' => 'datetime',
        ];
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    public function startedBy()
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function participations()
    {
        return $this->hasMany(MeetingParticipation::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(MeetingChatMessage::class);
    }

    public function isLive(): bool
    {
        return $this->ended_at === null;
    }

    /**
     * Per-student attendance summary: first join, last leave (null if still
     * connected), total time present (summed across reconnects), and how
     * many separate times they joined — each join/leave cycle is its own
     * MeetingParticipation row, grouped here by student.
     *
     * @return Collection<int, array{student_name: string, first_joined_at: string, last_left_at: ?string, join_count: int, total_duration_seconds: int}>
     */
    public function participantSummaries(): Collection
    {
        return $this->participations()
            ->with('user:id,name')
            ->orderBy('joined_at')
            ->get()
            ->groupBy('user_id')
            ->map(function (Collection $rows) {
                $rows = $rows->values();
                $stillJoined = $rows->contains(fn (MeetingParticipation $row) => $row->left_at === null);

                return [
                    'student_name' => $rows->first()->user->name ?? 'Unknown',
                    'first_joined_at' => $rows->first()->joined_at->toIso8601String(),
                    'last_left_at' => $stillJoined ? null : $rows->last()->left_at->toIso8601String(),
                    'join_count' => $rows->count(),
                    'total_duration_seconds' => $rows->sum(fn (MeetingParticipation $row) => $row->durationSeconds() ?? 0),
                ];
            })
            ->values();
    }
}
