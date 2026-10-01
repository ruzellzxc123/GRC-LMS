<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A department's curriculum map — the fixed list of subjects a program
     * offers, keyed by year level + semester (per the official curriculum
     * sheet), used to populate the Subject Title dropdown when a professor
     * or admin creates a new subject, instead of a free-text field.
     * `year_level`/`semester` are null for `category = 'elective'` rows
     * (a shared pool of Professional Electives not tied to one year/term).
     */
    public function up(): void
    {
        Schema::create('curriculum_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('year_level', 20)->nullable();
            $table->string('semester', 20)->nullable();
            $table->string('category', 20)->default('regular');
            $table->string('code', 50);
            $table->string('title', 255);
            $table->unsignedTinyInteger('lec')->nullable();
            $table->unsignedTinyInteger('lab')->nullable();
            $table->decimal('units', 3, 1)->nullable();
            $table->string('pre_req', 100)->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->unique(['department_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_subjects');
    }
};
