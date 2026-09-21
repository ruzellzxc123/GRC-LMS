<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->time('class_start_time')->nullable()->after('meeting_started_at');
            $table->time('class_end_time')->nullable()->after('class_start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn(['class_start_time', 'class_end_time']);
        });
    }
};
