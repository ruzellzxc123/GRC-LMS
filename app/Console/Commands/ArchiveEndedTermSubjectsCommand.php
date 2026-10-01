<?php

namespace App\Console\Commands;

use App\Services\SubjectArchivingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('subjects:archive-ended-terms')]
#[Description('Archive every subject whose academic term has already ended and un-enroll its students, exactly like the automatic check that already runs on every admin/professor request. Safe to run from a real cron job too, if one is ever set up — it is a no-op when nothing is left to archive.')]
class ArchiveEndedTermSubjectsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(SubjectArchivingService $archivingService): int
    {
        $count = $archivingService->archiveSubjectsForEndedTerms();

        $this->info($count === 0
            ? 'No subjects to archive — nothing left to do.'
            : "Archived {$count} subject(s) from ended terms.");

        return self::SUCCESS;
    }
}
