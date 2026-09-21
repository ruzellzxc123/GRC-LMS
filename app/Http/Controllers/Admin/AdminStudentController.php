<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminStudentController extends Controller
{
    use ProfileValidationRules;

    private const PROGRAMS = [
        'Bachelor of Science In Computer Science',
        'Bachelor of Science In Education',
        'Bachelor of Science In Accounting',
    ];

    public function index(Request $request): Response
    {
        $search = trim(
            (string) $request->query('search', ''),
        );

        $students = User::query()
            ->where('role', 'student')
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(function ($studentQuery) use ($search): void {
                        $studentQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%")
                            ->orWhere('section', 'like', "%{$search}%")
                            ->orWhere('program', 'like', "%{$search}%");
                    });
                },
            )
            ->orderBy('name')
            ->paginate(
                10,
                [
                    'id',
                    'name',
                    'email',
                    'student_id',
                    'program',
                    'year_level',
                    'section',
                ],
            )
            ->withQueryString();

        return Inertia::render('admin/students/index', [
            'students' => $students,

            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/students/create', [
            'adminMode' => true,
            'accountType' => 'student',

            'passwordRules' => Password::defaults()
                ->toPasswordRulesString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],

            'student_id' => $this->studentIdRules(),

            'birthday' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],

            'program' => [
                'required',
                Rule::in(self::PROGRAMS),
            ],

            'year_level' => [
                'required',
                Rule::in([
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                ]),
            ],

            'section' => $this->sectionRules($request),

            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
            ],
        ]);

        // Student IDs are permanent once issued — this is the only place
        // that ever accepts one.

        $student = new User;

        $student->name = $validated['name'];
        $student->email = $validated['email'];
        $student->student_id = $validated['student_id'];
        $student->birthday = $validated['birthday'] ?? null;
        $student->program = $validated['program'];
        $student->year_level = $validated['year_level'];
        $student->section = $validated['section'];
        $student->role = 'student';
        $student->password = Hash::make(
            $validated['password'],
        );

        $student->save();

        event(new Registered($student));

        return redirect()
            ->route('admin.students.index')
            ->with(
                'success',
                "Student account for {$student->name} was created successfully.",
            );
    }

    public function edit(User $student): Response
    {
        abort_unless(
            $student->role === 'student',
            404,
        );

        return Inertia::render('admin/students/edit', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'student_id' => $student->student_id,

                'birthday' => $student->birthday
                    ? Carbon::parse($student->birthday)
                        ->format('Y-m-d')
                    : null,

                'program' => $student->program,
                'year_level' => $student->year_level,
                'section' => $student->section,
            ],
        ]);
    }

    public function update(
        Request $request,
        User $student,
    ): RedirectResponse {
        abort_unless(
            $student->role === 'student',
            404,
        );

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',

                Rule::unique('users', 'email')
                    ->ignore($student->id),
            ],

            'birthday' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],

            'program' => [
                'required',
                Rule::in(self::PROGRAMS),
            ],

            'year_level' => [
                'required',
                Rule::in([
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                ]),
            ],

            'section' => $this->sectionRules($request),
        ]);

        // student_id is permanent once issued — never accepted here.
        $student->name = $validated['name'];
        $student->email = $validated['email'];
        $student->birthday = $validated['birthday'] ?? null;
        $student->program = $validated['program'];
        $student->year_level = $validated['year_level'];
        $student->section = $validated['section'];

        $student->save();

        return redirect()
            ->route('admin.students.index')
            ->with(
                'success',
                "Student {$student->name} was updated successfully.",
            );
    }

    private function sectionRules(Request $request): array
    {
        return [
            'required',
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
