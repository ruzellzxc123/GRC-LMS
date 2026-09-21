<?php

namespace App\Services;

use App\Models\CourseContentItem;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Support\Collection;

final class StudentNotificationService
{
    /**
     * Published quizzes with a deadline, belonging to a subject the student
     * is enrolled in, that the student hasn't answered yet. A quiz attached
     * to a module is left out until that module is finished — it isn't
     * accessible yet, so a deadline reminder for it would be misleading.
     */
    public function pendingQuizDeadlines(User $user): Collection
    {
        if ($user->role !== 'student') {
            return collect();
        }

        return Quiz::query()
            ->whereNotNull('deadline')
            ->where('is_published', true)
            ->whereHas('courseware.enrollments', fn ($query) => $query->where('student_id', $user->id))
            ->whereDoesntHave('attempts', fn ($query) => $query->where('student_id', $user->id))
            ->where(function ($query) use ($user): void {
                $query->whereDoesntHave('contentItem')
                    ->orWhereHas(
                        'contentItem.views',
                        fn ($viewQuery) => $viewQuery->where('student_id', $user->id)->whereNotNull('finished_at'),
                    );
            })
            ->with('courseware:id,subject')
            ->get(['id', 'courseware_id', 'title', 'deadline']);
    }

    /**
     * Whether a professor has published or updated a module/quiz/exam/etc.
     * in one of the student's enrolled subjects since they last checked
     * their subjects — surfaced as a red "new" indicator in the sidebar.
     */
    public function hasNewContent(User $user): bool
    {
        if ($user->role !== 'student') {
            return false;
        }

        $since = $user->content_last_viewed_at ?? '1970-01-01 00:00:00';

        $coursewareIds = Enrollment::where('student_id', $user->id)->pluck('courseware_id');

        if ($coursewareIds->isEmpty()) {
            return false;
        }

        $hasNewItem = CourseContentItem::where('is_published', true)
            ->where('updated_at', '>', $since)
            ->whereHas('category', fn ($query) => $query->whereIn('courseware_id', $coursewareIds))
            ->exists();

        if ($hasNewItem) {
            return true;
        }

        return Quiz::where('is_published', true)
            ->where('updated_at', '>', $since)
            ->whereIn('courseware_id', $coursewareIds)
            ->exists();
    }
}
