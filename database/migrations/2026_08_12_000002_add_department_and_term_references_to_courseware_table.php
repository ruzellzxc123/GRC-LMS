<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            if (! Schema::hasColumn('courseware', 'course_code')) {
                $table->string('course_code')->nullable()->unique()->after('subject');
            }

            if (! Schema::hasColumn('courseware', 'department_id')) {
                $table->foreignId('department_id')
                    ->nullable()
                    ->constrained('departments')
                    ->nullOnDelete()
                    ->after('teacher');
            }

            if (! Schema::hasColumn('courseware', 'academic_term_id')) {
                $table->foreignId('academic_term_id')
                    ->nullable()
                    ->constrained('academic_terms')
                    ->nullOnDelete()
                    ->after('department_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            if (Schema::hasColumn('courseware', 'department_id')) {
                $table->dropForeign(['department_id']);
            }

            if (Schema::hasColumn('courseware', 'academic_term_id')) {
                $table->dropForeign(['academic_term_id']);
            }

            $columns = [];

            if (Schema::hasColumn('courseware', 'course_code')) {
                $columns[] = 'course_code';
            }
            if (Schema::hasColumn('courseware', 'department_id')) {
                $columns[] = 'department_id';
            }
            if (Schema::hasColumn('courseware', 'academic_term_id')) {
                $columns[] = 'academic_term_id';
            }

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
