<?php

namespace App\Services;

use App\Models\Courseware;
use App\Models\Enrollment;

final class SubjectArchivingService
{
    /**
     * Archive every subject whose academic term has ended and isn't
     * archived yet: stamp archived_at and drop its enrollments, so the
     * professor's active subject list only ever shows subjects from a
     * term that's still running (or has no term set at all). Content —
     * modules, quizzes, grade structure, uploads — is left untouched, so
     * the subject can later be reused wholesale for a new term.
     *
     * There's no queue or scheduler in this app, so this isn't a nightly
     * cron job — it's called from a lightweight middleware on every
     * admin/professor request instead, idempotent and cheap (a single
     * indexed query that's a no-op once nothing is left to archive).
     */
    public function archiveSubjectsForEndedTerms(): int
    {
        $endedSubjects = Courseware::query()
            ->whereNull('archived_at')
            ->whereHas(
                'academicTerm',
                fn ($query) => $query->whereNotNull('end_date')->where('end_date', '<', now()->toDateString()),
            )
            ->get(['id']);

        if ($endedSubjects->isEmpty()) {
            return 0;
        }

        $coursewareIds = $endedSubjects->pluck('id');

        Courseware::whereIn('id', $coursewareIds)->update(['archived_at' => now()]);
        Enrollment::whereIn('courseware_id', $coursewareIds)->delete();

        return $coursewareIds->count();
    }
}
