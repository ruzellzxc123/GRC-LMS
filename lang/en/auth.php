<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used during authentication for various
    | messages that we need to display to the user. You are free to modify
    | these language lines according to your application's requirements.
    |
    */

    'failed' => 'These credentials do not match our records.',
    'password' => 'The provided password is incorrect.',

    // Overridden from the framework default (which only shows :seconds) —
    // the student progressive lockout can run into tens of minutes, where
    // a raw second count is a lot harder to read at a glance.
    'throttle' => 'Too many login attempts. Please try again in :minutes minute(s).',

];
