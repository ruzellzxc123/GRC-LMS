<?php

namespace App\Http\Middleware;

use App\Services\SubjectArchivingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs the end-of-term auto-archive check once per request, for the
 * admin and professor portals only — the two places that ever need to see
 * an up-to-date archived/active split. A no-op once nothing's left to
 * archive, so this stays cheap on every request after the first one that
 * catches a newly-ended term.
 */
class ArchiveEndedTermSubjects
{
    public function __construct(private readonly SubjectArchivingService $archivingService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->archivingService->archiveSubjectsForEndedTerms();

        return $next($request);
    }
}
