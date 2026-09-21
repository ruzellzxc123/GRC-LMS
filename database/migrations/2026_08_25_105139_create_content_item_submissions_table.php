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
        Schema::create('content_item_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_content_item_id')->constrained('course_content_items')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_original_name');
            $table->decimal('score', 5, 2)->nullable();
            $table->dateTime('submitted_at');
            $table->timestamps();

            $table->unique(['course_content_item_id', 'student_id'], 'content_submissions_item_student_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_item_submissions');
    }
};
