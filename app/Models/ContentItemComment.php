<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentItemComment extends Model
{
    protected $fillable = [
        'course_content_item_id',
        'user_id',
        'body',
    ];

    public function item()
    {
        return $this->belongsTo(CourseContentItem::class, 'course_content_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
