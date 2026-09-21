<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentItemSubmission extends Model
{
    protected $fillable = [
        'course_content_item_id',
        'student_id',
        'file_path',
        'file_original_name',
        'score',
        'submitted_at',
        'acknowledged_at',
        'graded_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'submitted_at' => 'datetime',
            'acknowledged_at' => 'datetime',
            'graded_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(CourseContentItem::class, 'course_content_item_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
