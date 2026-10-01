<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired whenever an admin adds or removes a calendar announcement.
 * No payload — every authenticated user's calendar just refetches.
 */
class AnnouncementsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('announcements'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'announcements.updated';
    }
}
