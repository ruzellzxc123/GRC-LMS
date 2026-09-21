<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table): void {
            $table->unsignedInteger('questions_to_answer')->nullable()->after('time_limit_minutes');
        });

        Schema::table('quiz_attempts', function (Blueprint $table): void {
            $table->json('selected_question_ids')->nullable()->after('total_questions');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table): void {
            $table->dropColumn('questions_to_answer');
        });

        Schema::table('quiz_attempts', function (Blueprint $table): void {
            $table->dropColumn('selected_question_ids');
        });
    }
};
