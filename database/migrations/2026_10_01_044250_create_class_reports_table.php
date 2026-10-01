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
        Schema::create('class_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courseware_id')->constrained('courseware')->cascadeOnDelete();
            $table->foreignId('professor_id')->constrained('users')->cascadeOnDelete();
            $table->date('class_date');
            $table->foreignId('meeting_session_id')->nullable()->constrained()->nullOnDelete();
            $table->string('video_path')->nullable();
            $table->dateTime('submitted_at');
            $table->timestamps();

            $table->unique(['courseware_id', 'class_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_reports');
    }
};
