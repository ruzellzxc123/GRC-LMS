<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Notifications\VerificationCode;
use App\Services\VerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The mandatory password-change flow a student with mustChangePassword()
 * true is redirected into for every other route (see
 * RequirePasswordChange) — the only part of the portal they can reach
 * until it's done.
 */
class StudentPasswordChangeController extends Controller
{
    private const PURPOSE = 'forced-password-change';

    public function __construct(private readonly VerificationCodeService $codes) {}

    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('student/forced-password-change', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'pending' => $this->codes->hasPending(self::PURPOSE, $user->id),
            'deadline' => $user->created_at->copy()->addDays(3)->toIso8601String(),
        ]);
    }

    public function requestUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        $code = $this->codes->issue(self::PURPOSE, $user->id, [
            'new_password' => $validated['password'],
        ]);

        $user->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your new password',
            'Use the code below to confirm your new password and finish setting up your account.',
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We emailed a verification code to confirm your new password.')]);

        return back();
    }

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
                'locked' => 'Too many incorrect attempts. Start again.',
                default => 'That code is incorrect.',
            }]);
        }

        $user->update([
            'password' => $result['payload']['new_password'],
            'password_changed_at' => now(),
        ]);

        return redirect()->route('student.dashboard')->with('success', 'Password changed — welcome!');
    }

    public function resendCode(Request $request): RedirectResponse
    {
        $user = $request->user();
        $payload = $this->codes->payload(self::PURPOSE, $user->id);

        if ($payload === null) {
            return back()->withErrors(['code' => 'Nothing to resend — enter your new password again.']);
        }

        $code = $this->codes->issue(self::PURPOSE, $user->id, $payload);

        $user->notify(new VerificationCode(
            $code,
            $user->name,
            'Confirm your new password',
            'Use the code below to confirm your new password and finish setting up your account.',
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('We sent a new code.')]);

        return back();
    }

    public function cancelUpdate(Request $request): RedirectResponse
    {
        $this->codes->forget(self::PURPOSE, $request->user()->id);

        return back();
    }
}
