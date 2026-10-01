<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

/**
 * The email half of every "enter the 8-digit code we sent you" flow
 * (password changes, forced password changes, email changes). Takes its
 * greeting name as a constructor argument rather than reading
 * $notifiable->name, since an email-change confirmation is sent to the new
 * address via an anonymous route (Notification::route('mail', ...)), not to
 * a User model.
 */
class VerificationCode extends Notification
{
    public function __construct(
        private readonly string $code,
        private readonly string $greetingName,
        private readonly string $subjectLine,
        private readonly string $introLine,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine)
            ->greeting("Hello {$this->greetingName},")
            ->line($this->introLine)
            ->line(new HtmlString(
                '<p style="font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;">'.$this->code.'</p>'
            ))
            ->line('This code expires in 10 minutes.')
            ->line("If you didn't request this, you can safely ignore this email.");
    }
}
