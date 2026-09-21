<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('teacher_id')
                ->nullable()
                ->unique()
                ->after('student_id');

            $table->string('department')
                ->nullable()
                ->after('teacher_id');

            $table->string('specialization')
                ->nullable()
                ->after('department');

            $table->boolean('is_active')
                ->default(true)
                ->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['teacher_id']);

            $table->dropColumn([
                'teacher_id',
                'department',
                'specialization',
                'is_active',
            ]);
        });
    }
};
