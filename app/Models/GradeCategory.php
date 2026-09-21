<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeCategory extends Model
{
    protected $fillable = [
        'courseware_id',
        'term',
        'name',
        'weight',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
        ];
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    public function items()
    {
        return $this->hasMany(GradeItem::class)->orderBy('order');
    }
}
