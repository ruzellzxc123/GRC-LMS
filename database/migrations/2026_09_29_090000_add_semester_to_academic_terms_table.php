<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Term names have always informally encoded a semester (e.g. "FIRST
     * SEMESTER YR (2026-2027)"); this formalizes it so curriculum subjects
     * (which are strictly split into First/Second Semester per year level)
     * can be matched against whichever term is selected when creating a
     * subject, instead of relying on free-text name parsing every time.
     */
    public function up(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->string('semester', 20)->nullable()->after('name');
        });

        DB::table('academic_terms')->where('name', 'like', '%FIRST%')->update(['semester' => '1st Semester']);
        DB::table('academic_terms')->where('name', 'like', '%SECOND%')->update(['semester' => '2nd Semester']);
    }

    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            $table->dropColumn('semester');
        });
    }
};
