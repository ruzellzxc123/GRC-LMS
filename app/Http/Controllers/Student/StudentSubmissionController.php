<?php

namespace App\Http\Controllers\Student;

use App\Events\CourseContentUpdated;
use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
use App\Models\CourseContentItem;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentSubmissionController extends Controller
{
    public function store(Request $request, CourseContentItem $item): RedirectResponse
    {
        abort_unless($item->is_published && $item->category->requires_submission, 404);

        $courseware = $item->category->courseware;

        abort_unless(
            Enrollment::where('courseware_id', $courseware->id)
                ->where('student_id', auth()->id())
                ->exists(),
            403,
        );

        if ($item->isPastDeadline() && ! $item->hasLateExceptionFor(auth()->id())) {
            return back()->withErrors([
                'file' => "You're past the deadline for this submission. Please ask your professor for permission to submit late.",
            ]);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip,jpg,jpeg,png'],
        ]);

        $existing = ContentItemSubmission::where('course_content_item_id', $item->id)
            ->where('student_id', auth()->id())
            ->first();

        if ($existing?->file_path) {
            Storage::disk('public')->delete($existing->file_path);
        }

        $filePath = $request->file('file')->store('submissions', 'public');
        $fileOriginalName = $request->file('file')->getClientOriginalName();

        ContentItemSubmission::updateOrCreate(
            ['course_content_item_id' => $item->id, 'student_id' => auth()->id()],
            [
                'file_path' => $filePath,
                'file_original_name' => $fileOriginalName,
                'submitted_at' => now(),
                'score' => null,
            ],
        );

        CourseContentUpdated::dispatchSafely($courseware->id);

        return back()->with('success', 'Your submission was uploaded successfully.');
    }
}
