<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A module can have one quiz attached to it, created or edited straight
     * from the module's own upload/edit screen. If the quiz is deleted the
     * module just loses the link, it isn't deleted itself.
     */
    public function up(): void
    {
        Schema::table('course_content_items', function (Blueprint $table) {
            $table->foreignId('quiz_id')->nullable()->after('course_content_category_id')
                ->constrained('quizzes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_content_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quiz_id');
        });
    }
};
