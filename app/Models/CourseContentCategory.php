<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseContentCategory extends Model
{
    protected $fillable = [
        'courseware_id',
        'name',
        'order',
        'requires_submission',
    ];

    protected function casts(): array
    {
        return [
            'requires_submission' => 'boolean',
        ];
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    /**
     * Newest upload first — order still increments strictly with each new
     * item, so sorting it descending is exactly "most recently uploaded on
     * top" for every role that lists a category's items (admin, professor,
     * student).
     */
    public function items()
    {
        return $this->hasMany(CourseContentItem::class)->orderByDesc('order');
    }
}
