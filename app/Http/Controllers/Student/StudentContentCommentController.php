<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CourseContentItem;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudentContentCommentController extends Controller
{
    public function store(Request $request, CourseContentItem $item): RedirectResponse
    {
        abort_unless($item->is_published, 404);

        $courseware = $item->category->courseware;

        abort_unless(
            Enrollment::where('courseware_id', $courseware->id)
                ->where('student_id', auth()->id())
                ->exists(),
            403,
        );

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $item->comments()->create([
            'user_id' => auth()->id(),
            'body' => $validated['body'],
        ]);

        return back()->with('success', 'Comment was posted.');
    }
}
