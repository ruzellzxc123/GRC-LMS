<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminDepartmentController extends Controller
{
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
            'department' => $department,
        ]);
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
