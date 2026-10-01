<?php

use App\Http\Controllers\Settings\AvatarController;
use App\Http\Controllers\Settings\EmailChangeController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get(
        'settings/profile',
        [ProfileController::class, 'edit'],
    )->name('profile.edit');

    Route::patch(
        'settings/profile',
        [ProfileController::class, 'update'],
    )->name('profile.update');

    Route::post(
        'settings/avatar',
        [AvatarController::class, 'update'],
    )->name('avatar.update');

    Route::delete(
        'settings/avatar',
        [AvatarController::class, 'destroy'],
    )->name('avatar.destroy');
});

Route::middleware([
    'auth',
    'verified',
])->group(function () {
    Route::delete(
        'settings/profile',
        [ProfileController::class, 'destroy'],
    )->name('profile.destroy');

    Route::get(
        'settings/security',
        [SecurityController::class, 'edit'],
    )
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put(
        'settings/password',
        [SecurityController::class, 'requestUpdate'],
    )
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::post(
        'settings/password/confirm',
        [SecurityController::class, 'confirmUpdate'],
    )
        ->middleware('throttle:10,1')
        ->name('user-password.confirm');

    Route::post(
        'settings/password/resend',
        [SecurityController::class, 'resendCode'],
    )
        ->middleware('throttle:3,1')
        ->name('user-password.resend');

    Route::delete(
        'settings/password/pending',
        [SecurityController::class, 'cancelUpdate'],
    )->name('user-password.cancel');

    Route::put(
        'settings/email',
        [EmailChangeController::class, 'requestUpdate'],
    )
        ->middleware('throttle:6,1')
        ->name('user-email.update');

    Route::post(
        'settings/email/confirm-old',
        [EmailChangeController::class, 'confirmOld'],
    )
        ->middleware('throttle:10,1')
        ->name('user-email.confirm-old');

    Route::post(
        'settings/email/confirm-new',
        [EmailChangeController::class, 'confirmNew'],
    )
        ->middleware('throttle:10,1')
        ->name('user-email.confirm-new');

    Route::post(
        'settings/email/resend',
        [EmailChangeController::class, 'resendCode'],
    )
        ->middleware('throttle:3,1')
        ->name('user-email.resend');

    Route::delete(
        'settings/email/pending',
        [EmailChangeController::class, 'cancelUpdate'],
    )->name('user-email.cancel');

    Route::inertia(
        'settings/appearance',
        'settings/appearance',
    )->name('appearance.edit');
});
