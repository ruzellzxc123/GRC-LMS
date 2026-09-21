<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table
                ->string('student_id', 50)
                ->nullable()
                ->unique()
                ->after('name');

            $table
                ->date('birthday')
                ->nullable()
                ->after('email');

            $table
                ->string('year_level', 50)
                ->nullable()
                ->after('birthday');

            $table
                ->string('section', 100)
                ->nullable()
                ->after('year_level');

            $table
                ->string('program', 150)
                ->nullable()
                ->after('section');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['student_id']);

            $table->dropColumn([
                'student_id',
                'birthday',
                'year_level',
                'section',
                'program',
            ]);
        });
    }
};
