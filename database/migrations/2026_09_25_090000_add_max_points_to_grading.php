<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grade_items', function (Blueprint $table): void {
            $table->unsignedInteger('max_points')->default(100)->after('title');
        });

        Schema::table('course_content_items', function (Blueprint $table): void {
            $table->unsignedInteger('max_points')->default(100)->after('deadline');
        });
    }

    public function down(): void
    {
        Schema::table('grade_items', function (Blueprint $table): void {
            $table->dropColumn('max_points');
        });

        Schema::table('course_content_items', function (Blueprint $table): void {
            $table->dropColumn('max_points');
        });
    }
};
