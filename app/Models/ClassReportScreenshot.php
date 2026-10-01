<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassReportScreenshot extends Model
{
    protected $fillable = [
        'class_report_id',
        'file_path',
    ];

    public function report()
    {
        return $this->belongsTo(ClassReport::class, 'class_report_id');
    }
}
