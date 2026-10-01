<?php

namespace App\Models;

use App\Models\Concerns\HasDeadlineOverride;
use Illuminate\Database\Eloquent\Model;

class CourseContentItem extends Model
{
    use HasDeadlineOverride;

    protected $fillable = [
        'course_content_category_id',
        'quiz_id',
        'title',
        'description',
        'link',
        'file_path',
        'file_original_name',
        'order',
        'is_published',
        'timing_mode',
        'time_limit_minutes',
        'work_type',
        'delivery_mode',
        'deadline',
        'max_points',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'time_limit_minutes' => 'integer',
            'deadline' => 'datetime',
            'max_points' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(CourseContentCategory::class, 'course_content_category_id');
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function submissions()
    {
        return $this->hasMany(ContentItemSubmission::class);
    }

    public function comments()
    {
        return $this->hasMany(ContentItemComment::class)->oldest();
    }

    public function views()
    {
        return $this->hasMany(ContentItemView::class);
    }
}
