<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courseware_id')->constrained('courseware')->cascadeOnDelete();
            $table->string('term');
            $table->string('name');
            $table->decimal('weight', 5, 2)->nullable();
            $table->timestamps();
            $table->unique(['courseware_id', 'term', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_categories');
    }
};
