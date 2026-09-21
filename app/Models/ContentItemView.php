<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentItemView extends Model
{
    protected $fillable = [
        'course_content_item_id',
        'student_id',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(CourseContentItem::class, 'course_content_item_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class);
    }
}
