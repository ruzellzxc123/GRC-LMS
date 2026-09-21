<?php

use Illuminate\Support\Facades\Route;

it('registers the settings routes', function (): void {
    expect(Route::has('profile.edit'))->toBeTrue()
        ->and(Route::has('profile.update'))->toBeTrue()
        ->and(Route::has('profile.destroy'))->toBeTrue()
        ->and(Route::has('security.edit'))->toBeTrue()
        ->and(Route::has('user-password.update'))->toBeTrue()
        ->and(Route::has('appearance.edit'))->toBeTrue();
});
