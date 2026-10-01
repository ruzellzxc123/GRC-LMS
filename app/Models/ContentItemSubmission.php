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
            // Always a whole number — every write path validates 'integer'.
            // The column stayed decimal(5,2) for prior data, but the app
            // itself never means to show or send a fractional score.
            'score' => 'integer',
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
