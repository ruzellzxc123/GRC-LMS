<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Subject ID" was a free-typed, mostly-unused optional identifier,
     * separate from `subject_code` (the code students actually enroll
     * with) — removed from the system entirely per instruction.
     */
    public function up(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn('course_code');
        });
    }

    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->string('course_code')->nullable()->unique()->after('subject');
        });
    }
};
