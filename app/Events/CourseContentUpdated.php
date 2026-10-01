<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired whenever anything a student can see for a course changes — a
 * module, a quiz, a submission's grade, or the gradebook itself. Carries no
 * payload beyond which course; listeners just refetch their own page's
 * props rather than trying to keep a duplicate copy of the change in sync.
 */
class CourseContentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly int $coursewareId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("course.{$this->coursewareId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'course.updated';
    }

    /**
     * Dispatch without letting an unreachable broadcast server (Reverb)
     * turn an otherwise-successful action — saving a quiz, a grade, a
     * submission — into a 500. Broadcasting only powers "live update
     * without a refresh"; losing it for one request is a minor UX miss,
     * not a reason to fail the request. Broadcasting runs synchronously
     * here (QUEUE_CONNECTION=sync), so the failure is catchable right at
     * the call site rather than silently swallowed by a queue worker.
     */
    public static function dispatchSafely(int $coursewareId): void
    {
        try {
            self::dispatch($coursewareId);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
