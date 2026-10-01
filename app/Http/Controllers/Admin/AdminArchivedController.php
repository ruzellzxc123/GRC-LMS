<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\User;
use App\Services\CourseContentService;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminArchivedController extends Controller
{
    public function __construct(private readonly CourseContentService $contentService) {}

    /**
     * Every professor who has at least one archived subject, with a count —
     * the entry point into the drill-down (professor -> their archived
     * subjects -> one subject's content).
     */
    public function professors(): Response
    {
        $professors = User::query()
            ->where('role', 'professor')
            ->withCount(['coursesTaught as archived_subjects_count' => fn ($query) => $query->archived()])
            ->having('archived_subjects_count', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department']);

        return Inertia::render('admin/archived/professors', [
            'professors' => $professors->map(fn (User $professor) => [
                'id' => $professor->id,
                'name' => $professor->name,
                'email' => $professor->email,
                'department' => $professor->department,
                'archived_subjects_count' => $professor->archived_subjects_count,
            ]),
        ]);
    }

    /**
     * One professor's archived subjects.
     */
    public function subjects(User $professor): Response
    {
        abort_unless($professor->role === 'professor', 404);

        $courses = Courseware::query()
            ->where('professor_id', $professor->id)
            ->archived()
            ->with('academicTerm')
            ->orderByDesc('archived_at')
            ->get();

        return Inertia::render('admin/archived/subjects', [
            'professor' => $professor->only(['id', 'name', 'email']),
            'courses' => $courses->map(fn (Courseware $course) => [
                'id' => $course->id,
                'subject' => $course->subject,
                'subject_code' => $course->subject_code,
                'module_title' => $course->module_title,
                'year_level' => $course->year_level,
                'section' => $course->section,
                'archived_at' => $course->archived_at?->toIso8601String(),
                'academic_term' => $course->academicTerm?->only(['id', 'name', 'semester']),
            ]),
        ]);
    }

    /**
     * Read-only content view of one archived subject — the same
     * category/item structure a professor or student would see, with no
     * edit controls, for admin record-keeping.
     */
    public function show(Courseware $courseware): Response
    {
        abort_unless($courseware->isArchived(), 404);

        $categories = $this->contentService->categoriesFor($courseware);

        return Inertia::render('admin/archived/show', [
            'courseware' => [
                ...$courseware->only(['id', 'subject', 'subject_code', 'module_title', 'year_level', 'section']),
                'archived_at' => $courseware->archived_at?->toIso8601String(),
                'professor' => $courseware->professor,
                'professor_id' => $courseware->professor_id,
            ],
            'categories' => $categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'items' => $category->items->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'link' => $item->link,
                    'file_url' => $item->file_path ? Storage::url($item->file_path) : null,
                    'file_name' => $item->file_original_name,
                    'is_published' => $item->is_published,
                ]),
            ]),
        ]);
    }
}
