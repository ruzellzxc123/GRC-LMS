<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Notifications\VerificationCode;
use App\Services\VerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    private const PURPOSE = 'password-change';

    public function __construct(private readonly VerificationCodeService $codes) {}

    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'passwordChangePending' => $this->codes->hasPending(self::PURPOSE, $request->user()->id),
        ];

        return Inertia::render('settings/security', $props);
    }

    /**
     * Validate the requested password change and email an 8-digit code to
     * confirm it — the password itself isn't applied until confirmUpdate()
     * verifies that code, so a stolen session alone can't silently change
     * the account's password without access to the user's inbox too.
     */
    public function requestUpdate(PasswordUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $code = $this->codes->issue(self::PURPOSE, $user->id, [
            'new_password' => $request->validated('password'),
        ]);

        $user->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your password change',
            'Use the code below to confirm you want to change your account password.',
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We emailed a verification code to confirm this change.')]);

        return back();
    }

    /**
     * Confirm the pending password change with the emailed code.
     */
    public function confirmUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:8'],
        ]);

        $user = $request->user();
        $result = $this->codes->attempt(self::PURPOSE, $user->id, $validated['code']);

        if (! $result['ok']) {
            return back()->withErrors(['code' => match ($result['error']) {
                'expired' => 'That code has expired. Request a new one.',
                'locked' => 'Too many incorrect attempts. Start the password change again.',
                default => 'That code is incorrect.',
            }]);
        }

        $user->update(['password' => $result['payload']['new_password']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }

    /**
     * Send a fresh code for the already-validated pending change, without
     * requiring the current/new password to be re-entered.
     */
    public function resendCode(Request $request): RedirectResponse
    {
        $user = $request->user();
        $payload = $this->codes->payload(self::PURPOSE, $user->id);

        if ($payload === null) {
            return back()->withErrors(['code' => 'Nothing to resend — start the password change again.']);
        }

        $code = $this->codes->issue(self::PURPOSE, $user->id, $payload);

        $user->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your password change',
            'Use the code below to confirm you want to change your account password.',
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We sent a new code.')]);

        return back();
    }

    /**
     * Abandon the pending change so the user can edit the password fields
     * again instead of being stuck on the code-entry step.
     */
    public function cancelUpdate(Request $request): RedirectResponse
    {
        $this->codes->forget(self::PURPOSE, $request->user()->id);

        return back();
    }
}
