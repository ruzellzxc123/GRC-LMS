<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LateException extends Model
{
    protected $fillable = [
        'student_id',
        'exceptionable_type',
        'exceptionable_id',
        'granted_by',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function grantedBy()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    public function exceptionable()
    {
        return $this->morphTo();
    }
}
