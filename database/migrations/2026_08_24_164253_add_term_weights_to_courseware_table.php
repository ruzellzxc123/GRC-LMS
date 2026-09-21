<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->decimal('midterm_weight', 5, 2)->default(33.33)->after('year_level');
            $table->decimal('finals_weight', 5, 2)->default(66.67)->after('midterm_weight');
        });
    }

    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn(['midterm_weight', 'finals_weight']);
        });
    }
};
