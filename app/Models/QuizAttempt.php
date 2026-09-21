<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = [
        'quiz_id',
        'student_id',
        'total_questions',
        'correct_count',
        'started_at',
        'submitted_at',
        'selected_question_ids',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'selected_question_ids' => 'array',
        ];
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function responses()
    {
        return $this->hasMany(QuizResponse::class);
    }

    public function getScoreAttribute(): float
    {
        return $this->total_questions > 0
            ? round($this->correct_count / $this->total_questions * 100, 1)
            : 0.0;
    }

    public function getDurationSecondsAttribute(): ?int
    {
        if (! $this->started_at || ! $this->submitted_at) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->submitted_at);
    }
}
