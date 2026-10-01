<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * academic_term_id is becoming required going forward (a subject's
     * weekly schedule only has real-world meaning bounded by an actual
     * semester), but existing rows saved before that validation can't
     * retroactively enforce itself — so every orphaned subject here gets
     * assigned to whichever term is currently running, falling back to the
     * most recently started one if none is active right now. There's no
     * sensible way to reverse this (we can't tell which rows were
     * originally null), so down() is a no-op.
     */
    public function up(): void
    {
        $today = now()->toDateString();

        $activeTermId = DB::table('academic_terms')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->orderByDesc('start_date')
            ->value('id');

        $fallbackTermId = $activeTermId ?? DB::table('academic_terms')
            ->orderByDesc('start_date')
            ->value('id');

        if ($fallbackTermId !== null) {
            DB::table('courseware')
                ->whereNull('academic_term_id')
                ->update(['academic_term_id' => $fallbackTermId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
