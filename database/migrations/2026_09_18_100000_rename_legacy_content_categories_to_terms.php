<?php

use App\Models\CourseContentCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Content categories used to be Module/Quizzes/Exam/Activity. Subject
     * Content now only ever provisions Prelims/Midterm/Finals (each
     * submission-enabled), so any subject created before that change still
     * has the old names sitting in the database — this brings them in line
     * without losing whatever the professor already uploaded.
     */
    public function up(): void
    {
        $renames = [
            'Module' => 'Prelims',
            'Quizzes' => 'Midterm',
            'Exam' => 'Finals',
        ];

        foreach ($renames as $oldName => $newName) {
            CourseContentCategory::where('name', $oldName)->update([
                'name' => $newName,
                'requires_submission' => true,
            ]);
        }

        // "Activity" isn't one of the three terms anymore. Fold any items it
        // still has into that subject's "Finals" category (creating one if
        // the subject somehow doesn't have it yet), then drop the category.
        CourseContentCategory::where('name', 'Activity')
            ->get()
            ->each(function (CourseContentCategory $activity): void {
                if ($activity->items()->exists()) {
                    $finals = CourseContentCategory::firstOrCreate(
                        ['courseware_id' => $activity->courseware_id, 'name' => 'Finals'],
                        ['order' => 2, 'requires_submission' => true],
                    );

                    $activity->items()->update([
                        'course_content_category_id' => $finals->id,
                    ]);
                }

                $activity->delete();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('course_content_categories')
            ->where('name', 'Prelims')
            ->update(['name' => 'Module', 'requires_submission' => false]);

        DB::table('course_content_categories')
            ->where('name', 'Midterm')
            ->update(['name' => 'Quizzes', 'requires_submission' => false]);

        DB::table('course_content_categories')
            ->where('name', 'Finals')
            ->update(['name' => 'Exam', 'requires_submission' => false]);
    }
};
