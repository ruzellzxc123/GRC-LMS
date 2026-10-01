<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A subject can now run on one class schedule (as before) or two —
     * the existing `class_day`/`class_start_time`/`class_end_time` become
     * "schedule 1" (labeled "Face-to-Face and Synchronous Class" when dual)
     * and the new `_2` columns are "schedule 2" ("Asynchronous Class").
     */
    public function up(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->string('schedule_mode', 10)->default('single')->after('class_end_time');
            $table->string('class_day_2', 20)->nullable()->after('schedule_mode');
            $table->time('class_start_time_2')->nullable()->after('class_day_2');
            $table->time('class_end_time_2')->nullable()->after('class_start_time_2');
        });
    }

    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn(['schedule_mode', 'class_day_2', 'class_start_time_2', 'class_end_time_2']);
        });
    }
};
