<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Courseware;
use App\Models\CurriculumSubject;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminCoursewareController extends Controller
{
    private const YEAR_LEVELS = [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year',
    ];

    /** Classes never run on a Sunday. */
    private const CLASS_DAYS = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    private const SCHEDULE_MODES = ['single', 'dual'];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $yearLevel = trim((string) $request->query('year_level', ''));
        $departmentId = trim((string) $request->query('department_id', ''));

        $courses = Courseware::query()
            ->with(['department', 'academicTerm'])
            ->withCount('enrollments')
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(function ($courseQuery) use ($search): void {
                        $courseQuery
                            ->where('subject', 'like', "%{$search}%")
                            ->orWhere('subject_code', 'like', "%{$search}%")
                            ->orWhere('professor', 'like', "%{$search}%")
                            ->orWhere('module_title', 'like', "%{$search}%");
                    });
                },
            )
            ->when(
                $yearLevel !== '',
                fn ($query) => $query->where('year_level', $yearLevel),
            )
            ->when(
                $departmentId !== '',
                fn ($query) => $query->where('department_id', $departmentId),
            )
            ->orderBy('subject')
            ->paginate(10)
            ->withQueryString();

        $courses->through(fn (Courseware $course) => [
            ...$course->toArray(),
            'today_hyflex_mode' => $course->todaysHyflexMode(),
        ]);

        return Inertia::render('admin/courses/index', [
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'year_level' => $yearLevel,
                'department_id' => $departmentId,
            ],
            'year_levels' => self::YEAR_LEVELS,
            'class_days' => self::CLASS_DAYS,
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'academic_terms' => AcademicTerm::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'semester', 'start_date', 'end_date']),
            'professors' => $this->professorsPayload(),
            'curriculum_subjects' => CurriculumSubject::query()
                ->orderBy('order')
                ->orderBy('code')
                ->get(['id', 'department_id', 'year_level', 'semester', 'category', 'code', 'title']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'subject_code' => ['nullable', 'string', 'max:50', Rule::unique('courseware', 'subject_code')],
            'professor_id' => ['required', 'exists:users,id', $this->professorDepartmentRule($request)],
            'year_level' => ['nullable', Rule::in(self::YEAR_LEVELS)],
            'section' => $this->sectionRules($request),
            'hyflex_group' => ['nullable', Rule::in(['A', 'B'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            // A subject's weekly class schedule only has real-world meaning
            // bounded by an actual semester's date range — required so it
            // always auto-archives at term end and so meetings/reports stay
            // scoped to real dates instead of running indefinitely.
            'academic_term_id' => ['required', 'exists:academic_terms,id'],
            'schedule_mode' => ['required', Rule::in(self::SCHEDULE_MODES)],
            'class_day' => ['nullable', Rule::in(self::CLASS_DAYS)],
            'class_start_time' => ['nullable', 'date_format:H:i', 'required_with:class_end_time'],
            'class_end_time' => ['nullable', 'date_format:H:i', 'required_with:class_start_time', 'after:class_start_time'],
            'class_day_2' => ['nullable', Rule::in(self::CLASS_DAYS), Rule::requiredIf(fn () => $request->input('schedule_mode') === 'dual')],
            'class_start_time_2' => ['nullable', 'date_format:H:i', 'required_with:class_end_time_2'],
            'class_end_time_2' => ['nullable', 'date_format:H:i', 'required_with:class_start_time_2', 'after:class_start_time_2'],
        ]);

        // The display name always mirrors the assigned professor's account
        // name — there's no separate manual entry for it anymore.
        $validated['professor'] = User::find($validated['professor_id'])->name;

        // Admins no longer set the module title — the professor names their
        // own module from their course editor. Seed it with the subject
        // title so the required column has a sensible placeholder.
        $validated['module_title'] = $validated['subject'];

        if ($validated['schedule_mode'] !== 'dual') {
            $validated['class_day_2'] = null;
            $validated['class_start_time_2'] = null;
            $validated['class_end_time_2'] = null;
        }

        Courseware::create($validated);

        return Redirect::route('admin.courses.index')
            ->with('success', 'Subject was created successfully.');
    }

    public function update(Request $request, Courseware $courseware): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'subject_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('courseware', 'subject_code')
                    ->ignore($courseware->id),
            ],
            'professor_id' => ['required', 'exists:users,id', $this->professorDepartmentRule($request, $courseware->professor_id)],
            'year_level' => ['nullable', Rule::in(self::YEAR_LEVELS)],
            'section' => $this->sectionRules($request),
            'hyflex_group' => ['nullable', Rule::in(['A', 'B'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            // A subject's weekly class schedule only has real-world meaning
            // bounded by an actual semester's date range — required so it
            // always auto-archives at term end and so meetings/reports stay
            // scoped to real dates instead of running indefinitely.
            'academic_term_id' => ['required', 'exists:academic_terms,id'],
            'schedule_mode' => ['required', Rule::in(self::SCHEDULE_MODES)],
            'class_day' => ['nullable', Rule::in(self::CLASS_DAYS)],
            'class_start_time' => ['nullable', 'date_format:H:i', 'required_with:class_end_time'],
            'class_end_time' => ['nullable', 'date_format:H:i', 'required_with:class_start_time', 'after:class_start_time'],
            'class_day_2' => ['nullable', Rule::in(self::CLASS_DAYS), Rule::requiredIf(fn () => $request->input('schedule_mode') === 'dual')],
            'class_start_time_2' => ['nullable', 'date_format:H:i', 'required_with:class_end_time_2'],
            'class_end_time_2' => ['nullable', 'date_format:H:i', 'required_with:class_start_time_2', 'after:class_start_time_2'],
        ]);

        // The display name always mirrors the assigned professor's account
        // name — there's no separate manual entry for it anymore.
        $validated['professor'] = User::find($validated['professor_id'])->name;

        if ($validated['schedule_mode'] !== 'dual') {
            $validated['class_day_2'] = null;
            $validated['class_start_time_2'] = null;
            $validated['class_end_time_2'] = null;
        }

        // module_title isn't in $validated at all here — the professor owns
        // that field from their own course editor, so admin edits leave
        // whatever value is already stored untouched.
        $courseware->update($validated);

        return Redirect::route('admin.courses.index')
            ->with('success', 'Subject was updated successfully.');
    }

    /**
     * Professors annotated with their resolved department id, so the create
     * and edit forms can restrict the professor picker to the selected
     * department (the currently-assigned professor is always kept
     * selectable client-side even if their department doesn't match).
     */
    private function professorsPayload()
    {
        $departmentIdsByName = Department::query()->pluck('id', 'name');

        return User::query()
            ->where('role', 'professor')
            ->orderBy('name')
            ->get(['id', 'name', 'department'])
            ->map(fn (User $professor) => [
                'id' => $professor->id,
                'name' => $professor->name,
                'department_id' => $departmentIdsByName[$professor->department] ?? null,
            ]);
    }

    private function professorDepartmentRule(Request $request, ?int $currentProfessorId = null): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($request, $currentProfessorId): void {
            if (empty($value) || empty($request->input('department_id'))) {
                return;
            }

            if ($currentProfessorId !== null && (int) $value === $currentProfessorId) {
                return;
            }

            $professor = User::find($value);
            $professorDepartmentId = Department::where('name', $professor?->department)->value('id');

            if ($professorDepartmentId !== (int) $request->input('department_id')) {
                $fail('The selected professor does not belong to the selected department.');
            }
        };
    }

    private function sectionRules(Request $request): array
    {
        return [
            'nullable',
            'regex:/^\d{3}$/',
            function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                $expectedPrefix = match ($request->input('year_level')) {
                    '1st Year' => '1',
                    '2nd Year' => '2',
                    '3rd Year' => '3',
                    '4th Year' => '4',
                    default => null,
                };

                if ($expectedPrefix !== null && ! str_starts_with((string) $value, $expectedPrefix)) {
                    $fail('The section must match the selected year level.');
                }
            },
        ];
    }
}
