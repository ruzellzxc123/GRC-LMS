<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('late_exceptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('exceptionable_type');
            $table->unsignedBigInteger('exceptionable_id');
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['exceptionable_type', 'exceptionable_id', 'student_id'], 'late_exceptions_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('late_exceptions');
    }
};
