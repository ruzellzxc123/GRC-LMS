<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('password_changed_at')->nullable()->after('password');
        });

        // Backfill every existing account as already having changed its
        // password — this new "must change password" requirement is only
        // meant to apply to accounts created from now on (students whose
        // admin-assigned password they've never touched), not to silently
        // force every already-active user through it on their next login.
        DB::table('users')->update(['password_changed_at' => DB::raw('created_at')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('password_changed_at');
        });
    }
};
