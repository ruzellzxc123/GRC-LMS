<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Switching from the old 2-step fold-forward grading model (Prelims
        // folds into Midterm at one split, that result folds into Finals at
        // another split — the two splits never literally summed to 100%
        // together) to a flat model where Prelims/Midterm/Finals each carry
        // a direct, independent share of the overall grade that always sums
        // to 100% on its own. The old per-fold weights have no meaningful
        // value under the new formula, so every subject resets to the new
        // default split (25/25/50) rather than carrying over numbers tuned
        // for a different calculation.
        DB::statement('ALTER TABLE courseware MODIFY prelims_weight DECIMAL(5,2) NOT NULL DEFAULT 25.00');
        DB::statement('ALTER TABLE courseware MODIFY midterm_weight DECIMAL(5,2) NOT NULL DEFAULT 25.00');
        DB::statement('ALTER TABLE courseware MODIFY finals_weight DECIMAL(5,2) NOT NULL DEFAULT 50.00');

        DB::table('courseware')->update([
            'prelims_weight' => 25.00,
            'midterm_weight' => 25.00,
            'finals_weight' => 50.00,
        ]);

        Schema::table('courseware', function ($table): void {
            $table->dropColumn('midterm_period_weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courseware', function ($table): void {
            $table->decimal('midterm_period_weight', 5, 2)->default(70.00)->after('prelims_weight');
        });

        DB::statement('ALTER TABLE courseware MODIFY prelims_weight DECIMAL(5,2) NOT NULL DEFAULT 30.00');
        DB::statement('ALTER TABLE courseware MODIFY midterm_weight DECIMAL(5,2) NOT NULL DEFAULT 30.00');
        DB::statement('ALTER TABLE courseware MODIFY finals_weight DECIMAL(5,2) NOT NULL DEFAULT 70.00');

        DB::table('courseware')->update([
            'prelims_weight' => 30.00,
            'midterm_period_weight' => 70.00,
            'midterm_weight' => 30.00,
            'finals_weight' => 70.00,
        ]);
    }
};
