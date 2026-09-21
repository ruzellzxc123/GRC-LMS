<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = [
        'student_id',
        'courseware_id',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
