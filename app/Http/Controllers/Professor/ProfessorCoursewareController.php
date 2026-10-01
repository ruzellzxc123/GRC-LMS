<?php

namespace App\Http\Controllers\Professor;

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

    private const SCHEDULE_MODES = ['single', 'dual'];

    public function index(Request $request): Response
    {
        $yearLevel = trim((string) $request->query('year_level', ''));
        $departmentId = trim((string) $request->query('department_id', ''));

        $courses = Courseware::query()
            ->where('professor_id', auth()->id())
            ->active()
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
            'subject_code' => $course->subject_code,
            'professor_id' => $course->professor_id,
            'module_title' => $course->module_title,
            'year_level' => $course->year_level,
            'section' => $course->section,
            'hyflex_group' => $course->hyflex_group,
            'today_hyflex_mode' => $course->todaysHyflexMode(),
            'department_id' => $course->department_id,
            'academic_term_id' => $course->academic_term_id,
            'schedule_mode' => $course->schedule_mode,
            'class_day' => $course->class_day,
            'class_start_time' => $course->class_start_time?->format('H:i'),
            'class_end_time' => $course->class_end_time?->format('H:i'),
            'class_day_2' => $course->class_day_2,
            'class_start_time_2' => $course->class_start_time_2?->format('H:i'),
            'class_end_time_2' => $course->class_end_time_2?->format('H:i'),
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
                ->get(['id', 'name', 'semester', 'start_date', 'end_date']),
            'professors' => $this->professorsPayload(),
            'curriculum_subjects' => CurriculumSubject::query()
                ->orderBy('order')
                ->orderBy('code')
                ->get(['id', 'department_id', 'year_level', 'semester', 'category', 'code', 'title']),
        ]);
    }

    /**
     * A professor's own archived subjects — read-only aside from the one
     * "Reuse" action, since everything else about an archived subject
     * (content, grade structure) is only ever edited after it's brought
     * back via reuse().
     */
    public function archived(): Response
    {
        $courses = Courseware::query()
            ->where('professor_id', auth()->id())
            ->archived()
            ->with(['department', 'academicTerm'])
            ->orderByDesc('archived_at')
            ->paginate(10);

        $courses->through(fn (Courseware $course) => [
            'id' => $course->id,
            'subject' => $course->subject,
            'subject_code' => $course->subject_code,
            'module_title' => $course->module_title,
            'year_level' => $course->year_level,
            'section' => $course->section,
            'archived_at' => $course->archived_at?->toIso8601String(),
            'academic_term' => $course->academicTerm?->only(['id', 'name', 'semester']),
            'department' => $course->department ? ['name' => $course->department->name] : null,
        ]);

        return Inertia::render('professor/courses/archived', [
            'courses' => $courses,
        ]);
    }

    /**
     * Bring an archived subject back into active use: it keeps every
     * upload, quiz, and grade category exactly as it was, with only the
     * previous term's enrollments gone (already cleared when it was
     * archived) — the professor lands on the edit form right after so they
     * can rename it, pick a new term/section, and reschedule it for the
     * new semester in one motion.
     */
    public function reuse(Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($courseware->isArchived(), 404);

        // Clearing academic_term_id too, not just archived_at: the subject
        // was archived precisely because that term ended, so leaving the
        // old term attached would make the very next request's auto-archive
        // check immediately re-archive it. Un-set it here and the professor
        // picks the new term when they edit the subject's details below.
        $courseware->update(['archived_at' => null, 'academic_term_id' => null]);

        return Redirect::route('professor.courses.index')
            ->with('success', "\"{$courseware->subject}\" is active again — set its new term and update its details below.");
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'subject_code' => ['nullable', 'string', 'max:50', Rule::unique('courseware', 'subject_code')],
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

        $validated['professor_id'] = auth()->id();
        $validated['professor'] = auth()->user()->name;

        // Nobody manually names this anymore — it just mirrors the subject
        // title, same as the admin-created flow.
        $validated['module_title'] = $validated['subject'];

        if ($validated['schedule_mode'] !== 'dual') {
            $validated['class_day_2'] = null;
            $validated['class_start_time_2'] = null;
            $validated['class_end_time_2'] = null;
        }

        $courseware = Courseware::create($validated);

        return Redirect::route('professor.roster', $courseware)
            ->with('success', 'Subject was created successfully.');
    }

    public function update(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

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

        $validated['professor'] = User::find($validated['professor_id'])->name;

        if ($validated['schedule_mode'] !== 'dual') {
            $validated['class_day_2'] = null;
            $validated['class_start_time_2'] = null;
            $validated['class_end_time_2'] = null;
        }

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
