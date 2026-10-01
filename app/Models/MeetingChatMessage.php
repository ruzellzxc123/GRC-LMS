<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingChatMessage extends Model
{
    protected $fillable = [
        'meeting_session_id',
        'user_id',
        'body',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
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
}
