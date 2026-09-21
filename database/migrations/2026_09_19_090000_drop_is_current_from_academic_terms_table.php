<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An academic term's active/inactive status is now derived from
     * today's date against its start_date/end_date span, so there's
     * nothing left to manually flag.
     */
    public function up(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->dropColumn('is_current');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->boolean('is_current')->default(false)->after('finals_end');
        });
    }
};
