<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminAcademicTermController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $terms = AcademicTerm::query()
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%");
                },
            )
            ->orderByDesc('start_date')
            ->paginate(10, ['id', 'name', 'start_date', 'end_date'])
            ->withQueryString();

        $terms->through(fn (AcademicTerm $term) => [
            'id' => $term->id,
            'name' => $term->name,
            'start_date' => $term->start_date->format('Y-m-d'),
            'end_date' => $term->end_date->format('Y-m-d'),
            'is_active' => $term->isActive(),
        ]);

        return Inertia::render('admin/terms/index', [
            'terms' => $terms,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/terms/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('academic_terms', 'name')],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'prelims_start' => ['nullable', 'date'],
            'prelims_end' => ['nullable', 'date', 'after_or_equal:prelims_start'],
            'midterm_start' => ['nullable', 'date'],
            'midterm_end' => ['nullable', 'date', 'after_or_equal:midterm_start'],
            'finals_start' => ['nullable', 'date'],
            'finals_end' => ['nullable', 'date', 'after_or_equal:finals_start'],
            'hyflex_first_f2f_group' => ['nullable', Rule::in(['A', 'B'])],
        ]);

        AcademicTerm::create([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'prelims_start' => $validated['prelims_start'] ?? null,
            'prelims_end' => $validated['prelims_end'] ?? null,
            'midterm_start' => $validated['midterm_start'] ?? null,
            'midterm_end' => $validated['midterm_end'] ?? null,
            'finals_start' => $validated['finals_start'] ?? null,
            'finals_end' => $validated['finals_end'] ?? null,
            'hyflex_first_f2f_group' => $validated['hyflex_first_f2f_group'] ?? null,
        ]);

        return Redirect::route('admin.terms.index')
            ->with('success', 'Academic term was created successfully.');
    }

    public function edit(AcademicTerm $term): Response
    {
        return Inertia::render('admin/terms/edit', [
            'term' => $term,
        ]);
    }

    public function update(Request $request, AcademicTerm $term): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('academic_terms', 'name')->ignore($term->id),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'prelims_start' => ['nullable', 'date'],
            'prelims_end' => ['nullable', 'date', 'after_or_equal:prelims_start'],
            'midterm_start' => ['nullable', 'date'],
            'midterm_end' => ['nullable', 'date', 'after_or_equal:midterm_start'],
            'finals_start' => ['nullable', 'date'],
            'finals_end' => ['nullable', 'date', 'after_or_equal:finals_start'],
            'hyflex_first_f2f_group' => ['nullable', Rule::in(['A', 'B'])],
        ]);

        $term->update([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'prelims_start' => $validated['prelims_start'] ?? null,
            'prelims_end' => $validated['prelims_end'] ?? null,
            'midterm_start' => $validated['midterm_start'] ?? null,
            'midterm_end' => $validated['midterm_end'] ?? null,
            'finals_start' => $validated['finals_start'] ?? null,
            'finals_end' => $validated['finals_end'] ?? null,
            'hyflex_first_f2f_group' => $validated['hyflex_first_f2f_group'] ?? null,
        ]);

        return Redirect::route('admin.terms.index')
            ->with('success', 'Academic term was updated successfully.');
    }
}
