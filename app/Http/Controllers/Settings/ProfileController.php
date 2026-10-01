<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\VerificationCodeService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(private readonly VerificationCodeService $codes) {}

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $emailChangeStage = match (true) {
            $this->codes->hasPending(EmailChangeController::PURPOSE_NEW, $user->id) => 'confirm-new',
            $this->codes->hasPending(EmailChangeController::PURPOSE_OLD, $user->id) => 'confirm-old',
            default => 'none',
        };

        $pendingEmail = match ($emailChangeStage) {
            'confirm-new' => $this->codes->payload(EmailChangeController::PURPOSE_NEW, $user->id)['new_email'] ?? null,
            'confirm-old' => $this->codes->payload(EmailChangeController::PURPOSE_OLD, $user->id)['new_email'] ?? null,
            default => null,
        };

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'emailChangeStage' => $emailChangeStage,
            'emailChangePendingEmail' => $pendingEmail,
        ]);
    }

    /**
     * Update the user's profile information — name and the other editable
     * fields, but never email, which has its own verified flow
     * (EmailChangeController).
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());
        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
