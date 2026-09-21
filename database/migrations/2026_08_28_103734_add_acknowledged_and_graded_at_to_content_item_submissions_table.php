<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('content_item_submissions', function (Blueprint $table) {
            $table->dateTime('acknowledged_at')->nullable()->after('submitted_at');
            $table->dateTime('graded_at')->nullable()->after('score');
        });

        // `submitted_at` was originally created as a MySQL TIMESTAMP column,
        // which — being NOT NULL and the first TIMESTAMP-type column in the
        // table — silently gets an implicit `ON UPDATE CURRENT_TIMESTAMP`
        // clause, resetting to "now" on every unrelated update (e.g. a
        // professor grading the submission). DATETIME has no such behavior.
        DB::statement('ALTER TABLE content_item_submissions MODIFY submitted_at DATETIME NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('content_item_submissions', function (Blueprint $table) {
            $table->dropColumn(['acknowledged_at', 'graded_at']);
        });
    }
};
