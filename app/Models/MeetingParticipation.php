<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingParticipation extends Model
{
    protected $fillable = [
        'meeting_session_id',
        'user_id',
        'joined_at',
        'left_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
        ];
    }

    public function session()
    {
        return $this->belongsTo(MeetingSession::class, 'meeting_session_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function durationSeconds(): ?int
    {
        if ($this->left_at === null) {
            return null;
        }

        return $this->joined_at->diffInSeconds($this->left_at);
    }
}
