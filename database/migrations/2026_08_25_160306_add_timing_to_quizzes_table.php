<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('timing_mode', 20)->default('timestamp')->after('deadline');
            $table->unsignedInteger('time_limit_minutes')->nullable()->after('timing_mode');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['timing_mode', 'time_limit_minutes']);
        });
    }
};
