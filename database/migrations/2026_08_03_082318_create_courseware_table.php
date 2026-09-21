<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courseware', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            $table->string('teacher');
            $table->string('module_title');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courseware');
    }
};
