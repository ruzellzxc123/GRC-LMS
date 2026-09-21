<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminProfessorController extends Controller
{
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

        $professors = User::query()
            ->where('role', 'professor')
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(
                        function ($professorQuery) use ($search): void {
                            $professorQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'professor_id',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'department',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'program',
                                    'like',
                                    "%{$search}%",
                                );
                        },
                    );
                },
            )
            ->orderBy('name')
            ->paginate(
                10,
                [
                    'id',
                    'name',
                    'email',
                    'professor_id',
                    'department',
                    'program',
                    'is_active',
                ],
            )
            ->withQueryString();

        return Inertia::render(
            'admin/professors/index',
            [
                'professors' => $professors,

                'filters' => [
                    'search' => $search,
                ],
            ],
        );
    }

    public function create(): Response
    {
        return Inertia::render(
            'admin/professors/create',
            [
                'departments' => Department::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),

                'passwordRules' => Password::defaults()
                    ->toPasswordRulesString(),
            ],
        );
    }

    public function store(
        Request $request,
    ): RedirectResponse {
        $validated = $request->validate([
            'professor_id' => [
                'required',
                'string',
                'regex:/^\d{4}-\d{2}-\d{5}$/',
                Rule::unique('users', 'professor_id'),
            ],

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

            'department' => [
                'required',
                Rule::exists('departments', 'name'),
            ],

            'program' => [
                'required',
                Rule::in(self::PROGRAMS),
            ],

            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
            ],
        ]);

        $professor = new User;

        $professor->professor_id =
            $validated['professor_id'];

        $professor->name =
            $validated['name'];

        $professor->email =
            $validated['email'];

        $professor->department =
            $validated['department'];

        $professor->program =
            $validated['program'];

        $professor->role = 'professor';

        $professor->is_active = true;

        $professor->password = Hash::make(
            $validated['password'],
        );

        $professor->save();

        return redirect()
            ->route('admin.professors.index')
            ->with(
                'success',
                "Professor {$professor->name} was created successfully.",
            );
    }

    public function edit(User $professor): Response
    {
        abort_unless(
            $professor->role === 'professor',
            404,
        );

        return Inertia::render(
            'admin/professors/edit',
            [
                'professor' => [
                    'id' => $professor->id,
                    'professor_id' => $professor->professor_id,
                    'name' => $professor->name,
                    'email' => $professor->email,
                    'department' => $professor->department,
                    'program' => $professor->program,
                    'is_active' => (bool) $professor->is_active,
                ],

                'departments' => Department::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
            ],
        );
    }

    public function update(
        Request $request,
        User $professor,
    ): RedirectResponse {
        abort_unless(
            $professor->role === 'professor',
            404,
        );

        $validated = $request->validate([
            'professor_id' => [
                'required',
                'string',
                'regex:/^\d{4}-\d{2}-\d{5}$/',

                Rule::unique('users', 'professor_id')
                    ->ignore($professor->id),
            ],

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
                    ->ignore($professor->id),
            ],

            'department' => [
                'required',
                Rule::exists('departments', 'name'),
            ],

            'program' => [
                'required',
                Rule::in(self::PROGRAMS),
            ],
        ]);

        $professor->professor_id =
            $validated['professor_id'];

        $professor->name =
            $validated['name'];

        $professor->email =
            $validated['email'];

        $professor->department =
            $validated['department'];

        $professor->program =
            $validated['program'];

        $professor->save();

        return redirect()
            ->route('admin.professors.index')
            ->with(
                'success',
                "Professor {$professor->name} was updated successfully.",
            );
    }

    public function toggleStatus(
        User $professor,
    ): RedirectResponse {
        abort_unless(
            $professor->role === 'professor',
            404,
        );

        $professor->is_active =
            ! $professor->is_active;

        $professor->save();

        $status = $professor->is_active
            ? 'activated'
            : 'deactivated';

        return back()->with(
            'success',
            "Professor {$professor->name} was {$status}.",
        );
    }
}
