<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'curriculum_file_path',
        'curriculum_file_original_name',
        'curriculum_uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'curriculum_uploaded_at' => 'datetime',
        ];
    }

    public function courses()
    {
        return $this->hasMany(Courseware::class);
    }

    public function curriculumSubjects()
    {
        return $this->hasMany(CurriculumSubject::class);
    }
}
