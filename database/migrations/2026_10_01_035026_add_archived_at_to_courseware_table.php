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
        Schema::table('courseware', function (Blueprint $table): void {
            $table->dateTime('archived_at')->nullable()->after('academic_term_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table): void {
            $table->dropColumn('archived_at');
        });
    }
};
