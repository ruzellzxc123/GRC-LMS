<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizGradeOverride extends Model
{
    protected $fillable = [
        'quiz_id',
        'student_id',
        'score',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
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
}
