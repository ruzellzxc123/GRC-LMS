<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_item_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_content_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('finished_at')->nullable();
            $table->timestamps();
            $table->unique(['course_content_item_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_item_views');
    }
};
