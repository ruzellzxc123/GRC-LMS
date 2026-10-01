<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeItem extends Model
{
    protected $fillable = [
        'grade_category_id',
        'course_content_item_id',
        'title',
        'order',
        'max_points',
    ];

    protected function casts(): array
    {
        return [
            'max_points' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(GradeCategory::class, 'grade_category_id');
    }

    public function scores()
    {
        return $this->hasMany(GradeScore::class);
    }

    /**
     * The uploaded module this grade item mirrors, when it was auto-created
     * from a graded submission (Assignments/Activities) rather than typed
     * in by hand (Recitation, Prelim Exam) — the link that lets a score
     * edited here sync back to that submission, and vice versa.
     */
    public function contentItem()
    {
        return $this->belongsTo(CourseContentItem::class, 'course_content_item_id');
    }
}
