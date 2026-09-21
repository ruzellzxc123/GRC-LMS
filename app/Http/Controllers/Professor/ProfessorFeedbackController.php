<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorFeedbackController extends Controller
{
    public function index(): Response
    {
        $feedback = Feedback::query()
            ->where('professor_id', auth()->id())
            ->with(['student', 'courseware'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('professor/feedback/index', [
            'feedback' => $feedback,
        ]);
    }

    public function create(Courseware $courseware, User $student): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $courseware->id)
                ->where('student_id', $student->id)
                ->exists(),
            404,
        );

        return Inertia::render('professor/feedback/create', [
            'courseware' => $courseware->only(['id', 'subject']),
            'student' => $student->only(['id', 'name']),
        ]);
    }

    public function store(Request $request, Courseware $courseware, User $student): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $courseware->id)
                ->where('student_id', $student->id)
                ->exists(),
            404,
        );

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        Feedback::create([
            'professor_id' => auth()->id(),
            'student_id' => $student->id,
            'courseware_id' => $courseware->id,
            'message' => $validated['message'],
        ]);

        return Redirect::route('professor.roster', $courseware)
            ->with('success', "Feedback sent to {$student->name}.");
    }
}
