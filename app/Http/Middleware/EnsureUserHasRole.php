<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
        }

        if (! in_array($user->role, $roles, true)) {
            // The most common way this is hit isn't a real access attempt —
            // it's a stale tab. Browser incognito windows share one cookie
            // jar with each other, so logging out and back in as a
            // different role in one tab silently changes who every other
            // open tab is signed in as; reloading one of those then lands
            // here. Bounce them to their own dashboard instead of a dead
            // end, since abort(403) reads as a real error either way.
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => "You're signed in as {$user->name} now, which doesn't have access to that page.",
            ]);

            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
