<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScore extends Model
{
    protected $fillable = [
        'grade_item_id',
        'student_id',
        'score',
    ];

    protected function casts(): array
    {
        return [
            // Always a whole number — every write path validates 'integer'.
            // The column stayed decimal(5,2) for prior data, but the app
            // itself never means to show or send a fractional score.
            'score' => 'integer',
        ];
    }

    public function item()
    {
        return $this->belongsTo(GradeItem::class, 'grade_item_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
