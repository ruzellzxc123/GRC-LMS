<?php

use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('course.{coursewareId}', function (User $user, int $coursewareId) {
    if ($user->role === 'admin') {
        return true;
    }

    if ($user->role === 'professor') {
        return Courseware::where('id', $coursewareId)->where('professor_id', $user->id)->exists();
    }

    return Enrollment::where('courseware_id', $coursewareId)->where('student_id', $user->id)->exists();
});

Broadcast::channel('announcements', function (User $user) {
    return true;
});
