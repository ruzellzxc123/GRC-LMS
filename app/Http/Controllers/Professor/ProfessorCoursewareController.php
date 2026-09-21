<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Courseware;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorCoursewareController extends Controller
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

    public function index(Request $request): Response
    {
        $yearLevel = trim((string) $request->query('year_level', ''));
        $departmentId = trim((string) $request->query('department_id', ''));

        $courses = Courseware::query()
            ->where('professor_id', auth()->id())
            ->with(['department', 'academicTerm'])
            ->withCount('enrollments')
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
            'id' => $course->id,
            'subject' => $course->subject,
            'course_code' => $course->course_code,
            'subject_code' => $course->subject_code,
            'professor_id' => $course->professor_id,
            'module_title' => $course->module_title,
            'year_level' => $course->year_level,
            'section' => $course->section,
            'hyflex_group' => $course->hyflex_group,
            'today_hyflex_mode' => $course->todaysHyflexMode(),
            'department_id' => $course->department_id,
            'academic_term_id' => $course->academic_term_id,
            'class_day' => $course->class_day,
            'class_start_time' => $course->class_start_time?->format('H:i'),
            'class_end_time' => $course->class_end_time?->format('H:i'),
            'enrollments_count' => $course->enrollments_count,
            'meeting_link' => $course->meetingUrl(),
            'uses_embedded_meeting' => $course->usesEmbeddedMeeting(),
            'department' => $course->department ? ['name' => $course->department->name] : null,
        ]);

        return Inertia::render('professor/courses/index', [
            'courses' => $courses,
            'filters' => [
                'year_level' => $yearLevel,
                'department_id' => $departmentId,
            ],
            'year_levels' => self::YEAR_LEVELS,
            'class_days' => self::CLASS_DAYS,
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'academic_terms' => AcademicTerm::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'start_date', 'end_date']),
            'professors' => $this->professorsPayload(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'course_code' => ['nullable', 'string', 'max:50', Rule::unique('courseware', 'course_code')],
            'subject_code' => ['nullable', 'string', 'max:50', Rule::unique('courseware', 'subject_code')],
            'year_level' => ['nullable', Rule::in(self::YEAR_LEVELS)],
            'section' => $this->sectionRules($request),
            'hyflex_group' => ['nullable', Rule::in(['A', 'B'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            'academic_term_id' => ['nullable', 'exists:academic_terms,id'],
            'class_day' => ['nullable', Rule::in(self::CLASS_DAYS)],
            'class_start_time' => ['nullable', 'date_format:H:i', 'required_with:class_end_time'],
            'class_end_time' => ['nullable', 'date_format:H:i', 'required_with:class_start_time', 'after:class_start_time'],
        ]);

        $validated['professor_id'] = auth()->id();
        $validated['professor'] = auth()->user()->name;

        // Nobody manually names this anymore — it just mirrors the subject
        // title, same as the admin-created flow.
        $validated['module_title'] = $validated['subject'];

        $courseware = Courseware::create($validated);

        return Redirect::route('professor.roster', $courseware)
            ->with('success', 'Subject was created successfully.');
    }

    public function update(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'course_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('courseware', 'course_code')
                    ->ignore($courseware->id),
            ],
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
            'academic_term_id' => ['nullable', 'exists:academic_terms,id'],
            'class_day' => ['nullable', Rule::in(self::CLASS_DAYS)],
            'class_start_time' => ['nullable', 'date_format:H:i', 'required_with:class_end_time'],
            'class_end_time' => ['nullable', 'date_format:H:i', 'required_with:class_start_time', 'after:class_start_time'],
        ]);

        $validated['professor'] = User::find($validated['professor_id'])->name;

        // module_title isn't in $validated at all here — nobody can rename
        // it after creation, so this leaves whatever value it already has.
        $courseware->update($validated);

        return Redirect::route('professor.courses.index')
            ->with('success', 'Subject was updated successfully.');
    }

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
