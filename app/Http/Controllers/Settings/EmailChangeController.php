<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Notifications\VerificationCode;
use App\Services\VerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Changing the account email takes two confirmations, not one: a code to
 * the CURRENT address (proving whoever's asking still controls this
 * account) and then a second code to the NEW address (proving they also
 * control that one) — only then does the email actually change. Either
 * code alone would leave a gap: skip the old-address step and a stolen
 * session could silently redirect account recovery to an attacker's inbox;
 * skip the new-address step and a typo'd email would lock the account out
 * of password resets.
 */
class EmailChangeController extends Controller
{
    public const PURPOSE_OLD = 'email-change-old';

    public const PURPOSE_NEW = 'email-change-new';

    public function __construct(private readonly VerificationCodeService $codes) {}

    public function requestUpdate(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        if ($validated['email'] === $user->email) {
            return back()->withErrors(['email' => 'That is already your current email address.']);
        }

        $code = $this->codes->issue(self::PURPOSE_OLD, $user->id, [
            'new_email' => $validated['email'],
        ]);

        $user->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your email change',
            "We received a request to change this account's email address. Enter the code below to confirm it's really you.",
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We emailed a code to your current address to confirm this change.')]);

        return back();
    }

    /**
     * First code confirmed (proves control of the current inbox) — now
     * send the second code to the new address to prove control of that
     * one too.
     */
    public function confirmOld(Request $request): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:8']]);
        $user = $request->user();

        $result = $this->codes->attempt(self::PURPOSE_OLD, $user->id, $validated['code']);

        if (! $result['ok']) {
            return back()->withErrors(['code' => self::errorMessage($result['error'])]);
        }

        $newEmail = $result['payload']['new_email'];
        $code = $this->codes->issue(self::PURPOSE_NEW, $user->id, ['new_email' => $newEmail]);

        Notification::route('mail', $newEmail)->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your new email address',
            'Enter the code below to confirm this is your new email address for your account.',
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We emailed a code to your new address to finish confirming it.')]);

        return back();
    }

    /**
     * Second code confirmed — the email actually changes here, and since
     * they just proved they control the new address, it's marked verified
     * immediately rather than needing a separate verification link too.
     */
    public function confirmNew(Request $request): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:8']]);
        $user = $request->user();

        $result = $this->codes->attempt(self::PURPOSE_NEW, $user->id, $validated['code']);

        if (! $result['ok']) {
            return back()->withErrors(['code' => self::errorMessage($result['error'])]);
        }

        $user->update([
            'email' => $result['payload']['new_email'],
            'email_verified_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email address updated.')]);

        return back();
    }

    public function resendCode(Request $request): RedirectResponse
    {
        $user = $request->user();

        $newStagePayload = $this->codes->payload(self::PURPOSE_NEW, $user->id);

        if ($newStagePayload !== null) {
            $code = $this->codes->issue(self::PURPOSE_NEW, $user->id, $newStagePayload);

            Notification::route('mail', $newStagePayload['new_email'])->notify(new VerificationCode(
                $code,
                $user->name,
                'Confirm your new email address',
                'Enter the code below to confirm this is your new email address for your account.',
            ));

            Inertia::flash('toast', ['type' => 'success', 'message' => __('We sent a new code.')]);

            return back();
        }

        $oldStagePayload = $this->codes->payload(self::PURPOSE_OLD, $user->id);

        if ($oldStagePayload !== null) {
            $code = $this->codes->issue(self::PURPOSE_OLD, $user->id, $oldStagePayload);

            $user->notify(new VerificationCode(
                $code,
                $user->name,
                'Confirm your email change',
                "We received a request to change this account's email address. Enter the code below to confirm it's really you.",
            ));

            Inertia::flash('toast', ['type' => 'success', 'message' => __('We sent a new code.')]);

            return back();
        }

        return back()->withErrors(['code' => 'Nothing to resend — start the email change again.']);
    }

    public function cancelUpdate(Request $request): RedirectResponse
    {
        $user = $request->user();

        $this->codes->forget(self::PURPOSE_OLD, $user->id);
        $this->codes->forget(self::PURPOSE_NEW, $user->id);

        return back();
    }

    private static function errorMessage(?string $error): string
    {
        return match ($error) {
            'expired' => 'That code has expired. Request a new one.',
            'locked' => 'Too many incorrect attempts. Start the email change again.',
            default => 'That code is incorrect.',
        };
    }
}
