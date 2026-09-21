<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminGradingOversightController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $submissions = ContentItemSubmission::query()
            ->with(['student:id,name,student_id', 'item.category.courseware'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner
                        ->whereHas(
                            'student',
                            fn ($studentQuery) => $studentQuery->where('name', 'like', "%{$search}%"),
                        )
                        ->orWhereHas(
                            'item.category.courseware',
                            fn ($courseQuery) => $courseQuery
                                ->where('subject', 'like', "%{$search}%")
                                ->orWhere('professor', 'like', "%{$search}%"),
                        );
                });
            })
            ->orderByRaw('COALESCE(graded_at, acknowledged_at, submitted_at) DESC')
            ->paginate(15)
            ->withQueryString();

        $submissions->through(fn (ContentItemSubmission $submission) => [
            'id' => $submission->id,
            'student_name' => $submission->student->name,
            'student_number' => $submission->student->student_id,
            'item_title' => $submission->item->title,
            'subject' => $submission->item->category->courseware->subject,
            'professor_name' => $submission->item->category->courseware->professor,
            'file_name' => $submission->file_original_name,
            'submitted_at' => $submission->submitted_at->toIso8601String(),
            'acknowledged_at' => $submission->acknowledged_at?->toIso8601String(),
            'graded_at' => $submission->graded_at?->toIso8601String(),
            'score' => $submission->score,
            'max_points' => $submission->item->max_points,
        ]);

        return Inertia::render('admin/grading/index', [
            'submissions' => $submissions,
            'stats' => [
                'total' => ContentItemSubmission::count(),
                'acknowledged' => ContentItemSubmission::whereNotNull('acknowledged_at')->count(),
                'graded' => ContentItemSubmission::whereNotNull('graded_at')->count(),
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
