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
            'score' => 'decimal:2',
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
