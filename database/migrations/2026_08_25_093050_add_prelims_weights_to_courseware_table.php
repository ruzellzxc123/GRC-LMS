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
        Schema::table('courseware', function (Blueprint $table) {
            $table->decimal('prelims_weight', 5, 2)->default(30.00)->after('year_level');
            $table->decimal('midterm_period_weight', 5, 2)->default(70.00)->after('prelims_weight');
        });

        Schema::table('courseware', function (Blueprint $table) {
            $table->decimal('midterm_weight', 5, 2)->default(30.00)->change();
            $table->decimal('finals_weight', 5, 2)->default(70.00)->change();
        });

        DB::table('courseware')->update([
            'prelims_weight' => 30.00,
            'midterm_period_weight' => 70.00,
            'midterm_weight' => 30.00,
            'finals_weight' => 70.00,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn(['prelims_weight', 'midterm_period_weight']);
            $table->decimal('midterm_weight', 5, 2)->default(33.33)->change();
            $table->decimal('finals_weight', 5, 2)->default(66.67)->change();
        });
    }
};
