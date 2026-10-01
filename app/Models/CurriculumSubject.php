<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CurriculumSubject extends Model
{
    protected $fillable = [
        'department_id',
        'year_level',
        'semester',
        'category',
        'code',
        'title',
        'lec',
        'lab',
        'units',
        'pre_req',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'lec' => 'integer',
            'lab' => 'integer',
            'units' => 'decimal:1',
            'order' => 'integer',
        ];
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
