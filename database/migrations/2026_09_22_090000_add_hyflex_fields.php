<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_terms', function (Blueprint $table): void {
            $table->string('hyflex_first_f2f_group')->nullable()->after('finals_end');
        });

        Schema::table('courseware', function (Blueprint $table): void {
            $table->string('hyflex_group')->nullable()->after('section');
        });
    }

    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table): void {
            $table->dropColumn('hyflex_first_f2f_group');
        });

        Schema::table('courseware', function (Blueprint $table): void {
            $table->dropColumn('hyflex_group');
        });
    }
};
