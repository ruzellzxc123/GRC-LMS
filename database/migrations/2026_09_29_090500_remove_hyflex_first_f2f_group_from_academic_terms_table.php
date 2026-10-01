<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The HyFlex A/B weekly pattern is now a fixed rule (week 1 is always
     * synchronous for both groups; from week 2 it alternates, with group A
     * synchronous / group B face-to-face on even weeks and the reverse on
     * odd weeks) rather than a per-term configurable choice, so this no
     * longer means anything — see AcademicTerm::hyflexModeForWeek().
     */
    public function up(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->dropColumn('hyflex_first_f2f_group');
        });
    }

    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->string('hyflex_first_f2f_group', 1)->nullable();
        });
    }
};
