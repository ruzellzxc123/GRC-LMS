<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A student whose admin-assigned password they've never changed can't use
 * anything else in their portal until they do — redirected to the forced
 * change flow on every request except the routes that flow itself needs
 * (and logout, so they're never trapped unable to even sign out).
 */
class RequirePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->mustChangePassword()
            && ! $request->routeIs('student.password-change.*')
            && ! $request->routeIs('logout')
        ) {
            return redirect()->route('student.password-change.edit');
        }

        return $next($request);
    }
}
