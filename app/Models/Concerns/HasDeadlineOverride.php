<?php

namespace App\Models\Concerns;

use App\Models\LateException;

/**
 * Shared by the two models that can be "past due" (Quiz and
 * CourseContentItem) — a professor-granted exception lets one specific
 * student act on the item after its deadline anyway.
 */
trait HasDeadlineOverride
{
    public function lateExceptions()
    {
        return $this->morphMany(LateException::class, 'exceptionable');
    }

    public function isPastDeadline(): bool
    {
        return $this->deadline !== null && now()->gt($this->deadline);
    }

    public function hasLateExceptionFor(int|string $studentId): bool
    {
        return $this->lateExceptions()->where('student_id', $studentId)->exists();
    }
}
