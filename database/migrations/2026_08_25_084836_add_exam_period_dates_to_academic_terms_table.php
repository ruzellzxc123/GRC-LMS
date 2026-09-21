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
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->date('prelims_start')->nullable()->after('end_date');
            $table->date('prelims_end')->nullable()->after('prelims_start');
            $table->date('midterm_start')->nullable()->after('prelims_end');
            $table->date('midterm_end')->nullable()->after('midterm_start');
            $table->date('finals_start')->nullable()->after('midterm_end');
            $table->date('finals_end')->nullable()->after('finals_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->dropColumn([
                'prelims_start',
                'prelims_end',
                'midterm_start',
                'midterm_end',
                'finals_start',
                'finals_end',
            ]);
        });
    }
};
