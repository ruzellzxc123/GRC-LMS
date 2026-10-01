<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->string('curriculum_file_path')->nullable()->after('description');
            $table->string('curriculum_file_original_name')->nullable()->after('curriculum_file_path');
            $table->timestamp('curriculum_uploaded_at')->nullable()->after('curriculum_file_original_name');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn(['curriculum_file_path', 'curriculum_file_original_name', 'curriculum_uploaded_at']);
        });
    }
};
