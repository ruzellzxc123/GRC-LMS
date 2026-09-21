<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_content_items', function (Blueprint $table): void {
            $table->string('work_type')->default('activity')->after('quiz_id');
        });
    }

    public function down(): void
    {
        Schema::table('course_content_items', function (Blueprint $table): void {
            $table->dropColumn('work_type');
        });
    }
};
