<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\LoginRateLimiter;

/**
 * A student gets a progressive, Fibonacci-style lockout instead of
 * Fortify's flat "5 attempts per 60 seconds" default: 2 failed attempts
 * lock the account out, and every time they fail again after a lockout has
 * fully expired, the next lockout is the previous two lockout lengths
 * added together — 3, 6, 9, 15, 24, 39 minutes, and so on. A successful
 * login resets the sequence back to the start. Every other role keeps
 * Fortify's untouched default behavior (see isStudentAttempt()).
 *
 * Bound in place of the stock LoginRateLimiter in FortifyServiceProvider,
 * so Fortify's own login actions (which type-hint LoginRateLimiter) pick
 * this up automatically with no other changes needed.
 */
class StudentProgressiveLoginRateLimiter extends LoginRateLimiter
{
    private const MAX_ATTEMPTS = 2;

    /**
     * Seed of the Fibonacci-style sequence — every later term is the sum
     * of the two terms before it (3, 6, 9, 15, 24, 39, ...).
     */
    private const SEQUENCE_SEED = [3, 6];

    public function tooManyAttempts(Request $request)
    {
        if (! $this->isStudentAttempt($request)) {
            return parent::tooManyAttempts($request);
        }

        return $this->limiter->tooManyAttempts($this->throttleKey($request), self::MAX_ATTEMPTS);
    }

    public function increment(Request $request)
    {
        if (! $this->isStudentAttempt($request)) {
            parent::increment($request);

            return;
        }

        $key = $this->throttleKey($request);

        // The lockout length for the window this failure belongs to is
        // decided by its FIRST hit — Illuminate\Cache\RateLimiter::hit()
        // only sets the decay/timer once per window and silently ignores
        // it on later hits in the same window, so the cycle (and the
        // minutes it maps to) has to be resolved before incrementing, not
        // after the attempt that actually crosses the threshold.
        $isFreshWindow = $this->limiter->attempts($key) === 0;

        $minutes = $isFreshWindow
            ? $this->advanceCycleAndGetMinutes($key)
            : $this->currentWindowMinutes($key);

        $this->limiter->hit($key, $minutes * 60);
    }

    public function clear(Request $request)
    {
        parent::clear($request);

        if ($this->isStudentAttempt($request)) {
            $key = $this->throttleKey($request);

            Cache::forget($this->cycleKey($key));
            Cache::forget($this->windowMinutesKey($key));
        }
    }

    /**
     * Starting a brand-new counting window: look up (and advance) how many
     * full lockout cycles this key has already been through, and cache the
     * resulting minutes for the rest of this window to read back on its
     * later hit() calls.
     */
    private function advanceCycleAndGetMinutes(string $key): int
    {
        $cycleKey = $this->cycleKey($key);
        $cycle = (int) Cache::get($cycleKey, 0);
        $minutes = $this->fibonacciMinutes($cycle);

        // A week is long enough that a determined run of attempts across
        // several days still keeps escalating, but short enough that a
        // single old incident doesn't punish the account forever.
        Cache::put($cycleKey, $cycle + 1, now()->addWeek());
        Cache::put($this->windowMinutesKey($key), $minutes, now()->addMinutes($minutes));

        return $minutes;
    }

    private function currentWindowMinutes(string $key): int
    {
        return (int) Cache::get($this->windowMinutesKey($key), self::SEQUENCE_SEED[0]);
    }

    private function fibonacciMinutes(int $cycle): int
    {
        $sequence = self::SEQUENCE_SEED;

        while (count($sequence) <= $cycle) {
            $sequence[] = $sequence[count($sequence) - 1] + $sequence[count($sequence) - 2];
        }

        return $sequence[$cycle];
    }

    private function cycleKey(string $throttleKey): string
    {
        return "login-lockout-cycle:{$throttleKey}";
    }

    private function windowMinutesKey(string $throttleKey): string
    {
        return "login-lockout-minutes:{$throttleKey}";
    }

    private function isStudentAttempt(Request $request): bool
    {
        $email = trim((string) $request->input(Fortify::username()));

        if ($email === '') {
            return false;
        }

        return User::where('email', $email)->where('role', 'student')->exists();
    }
}
