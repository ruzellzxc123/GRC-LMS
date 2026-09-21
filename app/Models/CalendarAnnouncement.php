<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarAnnouncement extends Model
{
    protected $fillable = [
        'date',
        'title',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
