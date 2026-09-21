<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'enrollment_id',
        'date',
        'status',
        'remarks',
        'marked_by_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by_id');
    }
}
