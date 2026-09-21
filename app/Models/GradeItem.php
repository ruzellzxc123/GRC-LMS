<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeItem extends Model
{
    protected $fillable = [
        'grade_category_id',
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
}
