<?php

use App\Http\Controllers\CoursewareController;
use Illuminate\Support\Facades\Route;

Route::get('/courseware', [CoursewareController::class, 'index'])
    ->name('api.courseware.index');
