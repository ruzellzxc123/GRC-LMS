<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class ClassReport extends Model
{
    protected $fillable = [
        'courseware_id',
        'professor_id',
        'class_date',
        'meeting_session_id',
        'video_path',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'class_date' => 'date:Y-m-d',
            'submitted_at' => 'datetime',
        ];
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    public function professor()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function meetingSession()
    {
        return $this->belongsTo(MeetingSession::class);
    }

    public function screenshots()
    {
        return $this->hasMany(ClassReportScreenshot::class);
    }

    /**
     * @return Collection<int, array{student_name: string, first_joined_at: string, last_left_at: ?string, join_count: int, total_duration_seconds: int}>
     */
    public function participantSummaries(): Collection
    {
        return $this->meetingSession?->participantSummaries() ?? collect();
    }
}
