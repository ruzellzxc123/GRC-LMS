<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `hyflex` means the module follows the subject's existing HyFlex
     * schedule (Face-to-Face on one alternating week, Synchronous online on
     * the next, driven by the subject's `hyflex_group` + the term's
     * `hyflex_first_f2f_group` — unchanged, just now surfaced per module
     * instead of only as a course-wide "today" indicator). `asynchronous`
     * opts a module out of that schedule entirely — no live component, and
     * no points total to set on upload/edit.
     */
    public function up(): void
    {
        Schema::table('course_content_items', function (Blueprint $table) {
            $table->string('delivery_mode', 20)->default('hyflex')->after('work_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_content_items', function (Blueprint $table) {
            $table->dropColumn('delivery_mode');
        });
    }
};
