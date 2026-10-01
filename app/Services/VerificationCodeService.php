<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Backs every "we emailed you an 8-digit code, enter it to confirm" flow in
 * the app (password changes, forced password changes, email changes) —
 * one cache-backed store keyed by purpose + subject, so each flow doesn't
 * reinvent code generation, hashing, expiry, and attempt-lockout itself.
 */
final class VerificationCodeService
{
    private const TTL_MINUTES = 10;

    private const MAX_ATTEMPTS = 5;

    /**
     * Create and cache a new code, returning the plaintext to email —
     * nothing but its hash is ever stored.
     *
     * @param  array<string, mixed>  $payload  Carried through to a
     *                                         successful attempt() — e.g. the new password or new email a code is confirming.
     */
    public function issue(string $purpose, int|string $subjectId, array $payload = []): string
    {
        $code = self::generateCode();

        Cache::put(self::key($purpose, $subjectId), [
            'code_hash' => Hash::make($code),
            'payload' => $payload,
            'attempts' => 0,
        ], now()->addMinutes(self::TTL_MINUTES));

        return $code;
    }

    public function hasPending(string $purpose, int|string $subjectId): bool
    {
        return Cache::has(self::key($purpose, $subjectId));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function payload(string $purpose, int|string $subjectId): ?array
    {
        return Cache::get(self::key($purpose, $subjectId))['payload'] ?? null;
    }

    /**
     * @return array{ok: bool, payload: array<string, mixed>|null, error: 'expired'|'locked'|'incorrect'|null}
     */
    public function attempt(string $purpose, int|string $subjectId, string $code): array
    {
        $key = self::key($purpose, $subjectId);
        $pending = Cache::get($key);

        if ($pending === null) {
            return ['ok' => false, 'payload' => null, 'error' => 'expired'];
        }

        if (! Hash::check($code, $pending['code_hash'])) {
            $pending['attempts']++;

            if ($pending['attempts'] >= self::MAX_ATTEMPTS) {
                Cache::forget($key);

                return ['ok' => false, 'payload' => null, 'error' => 'locked'];
            }

            Cache::put($key, $pending, now()->addMinutes(self::TTL_MINUTES));

            return ['ok' => false, 'payload' => null, 'error' => 'incorrect'];
        }

        Cache::forget($key);

        return ['ok' => true, 'payload' => $pending['payload'], 'error' => null];
    }

    public function forget(string $purpose, int|string $subjectId): void
    {
        Cache::forget(self::key($purpose, $subjectId));
    }

    public static function generateCode(): string
    {
        return str_pad((string) random_int(0, 99_999_999), 8, '0', STR_PAD_LEFT);
    }

    private static function key(string $purpose, int|string $subjectId): string
    {
        return "verification-code:{$purpose}:{$subjectId}";
    }
}
