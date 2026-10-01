<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminEnrollmentController extends Controller
{
    public function index(Request $request, Courseware $courseware): Response
    {
        $studentSearch = trim((string) $request->query('student_search', ''));

        $enrollments = Enrollment::query()
            ->where('courseware_id', $courseware->id)
            ->with('student')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $candidates = User::query()
            ->where('role', 'student')
            ->whereDoesntHave('enrollments', function ($query) use ($courseware): void {
                $query->where('courseware_id', $courseware->id);
            })
            ->when(
                $studentSearch !== '',
                function ($query) use ($studentSearch): void {
                    $query->where(function ($studentQuery) use ($studentSearch): void {
                        $studentQuery
                            ->where('name', 'like', "%{$studentSearch}%")
                            ->orWhere('email', 'like', "%{$studentSearch}%")
                            ->orWhere('student_id', 'like', "%{$studentSearch}%");
                    });
                },
            )
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'email', 'student_id']);

        return Inertia::render('admin/courses/enrollments', [
            'courseware' => $courseware->only(['id', 'subject']),
            'enrollments' => $enrollments,
            'candidates' => $candidates,
            'filters' => [
                'student_search' => $studentSearch,
            ],
        ]);
    }

    public function store(Request $request, Courseware $courseware): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => [
                'required',
                Rule::exists('users', 'id')->where('role', 'student'),
            ],
        ]);

        Enrollment::firstOrCreate([
            'student_id' => $validated['student_id'],
            'courseware_id' => $courseware->id,
        ]);

        return Redirect::route('admin.enrollments.index', $courseware)
            ->with('success', 'Student was enrolled successfully.');
    }

    public function destroy(Courseware $courseware, Enrollment $enrollment): RedirectResponse
    {
        abort_unless($enrollment->courseware_id === $courseware->id, 404);

        $enrollment->delete();

        return Redirect::route('admin.enrollments.index', $courseware)
            ->with('success', 'Student was unenrolled successfully.');
    }
}
