<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\CurriculumFileParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AdminDepartmentController extends Controller
{
    private const YEAR_LEVELS = [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year',
    ];

    private const SEMESTERS = ['1st Semester', '2nd Semester'];

    public function __construct(
        private readonly CurriculumFileParser $curriculumFileParser,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $departments = Department::query()
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(function ($departmentQuery) use ($search): void {
                        $departmentQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
                },
            )
            ->orderBy('name')
            ->paginate(10, ['id', 'name', 'code', 'description'])
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/departments/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')],
            'description' => ['nullable', 'string'],
        ]);

        Department::create($validated);

        return Redirect::route('admin.departments.index')
            ->with('success', 'Department was created successfully.');
    }

    public function edit(Department $department): Response
    {
        return Inertia::render('admin/departments/edit', [
            'department' => [
                ...$department->only(['id', 'name', 'code', 'description']),
                'curriculum_file_url' => $department->curriculum_file_path
                    ? Storage::url($department->curriculum_file_path)
                    : null,
                'curriculum_file_name' => $department->curriculum_file_original_name,
                'curriculum_uploaded_at' => $department->curriculum_uploaded_at?->toIso8601String(),
            ],
            'curriculum_subjects' => $department->curriculumSubjects()
                ->orderBy('year_level')
                ->orderBy('semester')
                ->orderBy('order')
                ->orderBy('code')
                ->get(),
            'year_levels' => self::YEAR_LEVELS,
            'semesters' => self::SEMESTERS,
        ]);
    }

    public function uploadCurriculum(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'curriculum_file' => [
                'required',
                'file',
                'max:10240',
                'mimes:xlsx,xls,csv',
            ],
        ]);

        // Parsed first, before touching anything already saved — a
        // malformed file must never wipe out a department's existing,
        // working subject list.
        try {
            $subjects = $this->curriculumFileParser->parse($validated['curriculum_file']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['curriculum_file' => $e->getMessage()]);
        }

        $path = $validated['curriculum_file']->store('curricula', 'public');
        $oldPath = $department->curriculum_file_path;

        DB::transaction(function () use ($department, $subjects, $path, $validated): void {
            $department->curriculumSubjects()->delete();
            $department->curriculumSubjects()->createMany($subjects);

            $department->update([
                'curriculum_file_path' => $path,
                'curriculum_file_original_name' => $validated['curriculum_file']->getClientOriginalName(),
                'curriculum_uploaded_at' => now(),
            ]);
        });

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return Redirect::route('admin.departments.edit', $department)
            ->with('success', count($subjects).' subject(s) were loaded from the curriculum file.');
    }

    public function destroyCurriculumFile(Department $department): RedirectResponse
    {
        if ($department->curriculum_file_path) {
            Storage::disk('public')->delete($department->curriculum_file_path);
        }

        DB::transaction(function () use ($department): void {
            // The file is this department's only source of subject data —
            // removing it removes the Subject Title dropdown options too.
            $department->curriculumSubjects()->delete();

            $department->update([
                'curriculum_file_path' => null,
                'curriculum_file_original_name' => null,
                'curriculum_uploaded_at' => null,
            ]);
        });

        return Redirect::route('admin.departments.edit', $department)
            ->with('success', 'Curriculum file and its subjects were removed.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments', 'name')->ignore($department->id),
            ],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'code')->ignore($department->id),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $department->update($validated);

        return Redirect::route('admin.departments.index')
            ->with('success', 'Department was updated successfully.');
    }
}
