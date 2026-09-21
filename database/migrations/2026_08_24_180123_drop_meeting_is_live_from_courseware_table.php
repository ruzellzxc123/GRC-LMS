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
        Schema::table('courseware', function (Blueprint $table) {
            $table->dropColumn('meeting_is_live');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courseware', function (Blueprint $table) {
            $table->boolean('meeting_is_live')->default(false)->after('meeting_link');
        });
    }
};
