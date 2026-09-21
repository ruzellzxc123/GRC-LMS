<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = [
        'professor_id',
        'student_id',
        'courseware_id',
        'message',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function professor()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }
}
