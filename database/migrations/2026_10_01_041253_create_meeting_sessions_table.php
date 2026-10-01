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
        Schema::create('meeting_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courseware_id')->constrained('courseware')->cascadeOnDelete();
            $table->foreignId('started_by')->constrained('users')->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->string('record_mode');
            $table->string('recording_status')->default('not_recording');
            $table->dateTime('recording_started_at')->nullable();
            $table->dateTime('recording_ended_at')->nullable();
            $table->string('recording_url')->nullable();
            $table->timestamps();

            $table->index(['courseware_id', 'ended_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_sessions');
    }
};
