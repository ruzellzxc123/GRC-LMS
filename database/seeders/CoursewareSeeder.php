<?php

namespace Database\Seeders;

use App\Models\Courseware;
use Illuminate\Database\Seeder;

class CoursewareSeeder extends Seeder
{
    public function run(): void
    {
        Courseware::insert([
            [
                'subject' => 'Introduction to Computing',
                'professor' => 'Prof. Mary Grace V. Piatos',
                'module_title' => 'Module 1: Lorem Ipsum Lorem Ipsum',
            ],
            [
                'subject' => 'Fundamentals of Programming',
                'professor' => 'Prof. Andy S. Lim',
                'module_title' => 'Module 1: Lorem Ipsum Lorem Ipsum',
            ],
            [
                'subject' => 'Mathematics in the Modern World',
                'professor' => 'Prof. Sarah Duterte',
                'module_title' => 'Module 1: Fox Silica Foks zileika',
            ],
            [
                'subject' => 'National Training Service Program',
                'professor' => 'Prof. Michael Fajatin',
                'module_title' => 'Module 1: Lorem Ipsum',
            ],
            [
                'subject' => 'Purposive Communication 1',
                'professor' => 'Prof. Roger Naldo',
                'module_title' => 'Module 1: Lorem Ipsum Lorem Ipsum',
            ],
        ]);
    }
}
