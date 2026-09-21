<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class StudentEnrollmentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'courseware_id' => [
                'required',
                Rule::exists('courseware', 'id'),
            ],
        ]);

        $courseware = Courseware::findOrFail($validated['courseware_id']);

        Enrollment::firstOrCreate([
            'student_id' => auth()->id(),
            'courseware_id' => $courseware->id,
        ]);

        return Redirect::route('student.courses.index')
            ->with('success', "You are now enrolled in {$courseware->subject}.");
    }
}
