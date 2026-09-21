<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Inertia\Inertia;
use Inertia\Response;

class StudentFeedbackController extends Controller
{
    public function index(): Response
    {
        Feedback::query()
            ->where('student_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $feedback = Feedback::query()
            ->where('student_id', auth()->id())
            ->with(['professor', 'courseware'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('student/feedback/index', [
            'feedback' => $feedback,
        ]);
    }
}
