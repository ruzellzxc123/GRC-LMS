<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\GradeCategory;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Services\TermGradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfessorGradeController extends Controller
{
    private const AUTO_MANAGED_CATEGORY_NAMES = ['Quizzes', 'Assignments', 'Activities', 'Attendance'];

    public function __construct(
        private readonly TermGradingService $gradingService,
    ) {}

    public function subjects(): Response
    {
        $courses = Courseware::query()
            ->where('professor_id', auth()->id())
            ->withCount(['enrollments', 'quizzes'])
            ->orderBy('subject')
            ->get();

        return Inertia::render('professor/grades/index', [
            'courses' => $courses->map(fn (Courseware $course) => [
                'id' => $course->id,
                'subject' => $course->subject,
                'course_code' => $course->course_code,
                'enrollments_count' => $course->enrollments_count,
                'quizzes_count' => $course->quizzes_count,
            ]),
        ]);
    }

    public function showTerm(Courseware $courseware, string $term): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless(in_array($term, TermGradingService::TERMS, true), 404);

        $categories = $this->gradingService->categoriesForTerm($courseware, $term);
        $table = $this->gradingService->buildTermTable($courseware, $term, $categories);

        $prelimsGrades = null;
        $midtermGrades = null;

        if ($term === 'midterm' || $term === 'finals') {
            $prelimsCategories = $this->gradingService->categoriesForTerm($courseware, 'prelims');
            $prelimsTable = $this->gradingService->buildTermTable($courseware, 'prelims', $prelimsCategories);
            $prelimsGrades = collect($prelimsTable['rows'])->keyBy('student_id');
        }

        if ($term === 'finals') {
            $midtermCategories = $this->gradingService->categoriesForTerm($courseware, 'midterm');
            $midtermTable = $this->gradingService->buildTermTable($courseware, 'midterm', $midtermCategories);
            $midtermGrades = collect($midtermTable['rows'])->map(function (array $row) use ($courseware, $prelimsGrades) {
                $prelimsRow = $prelimsGrades->get($row['student_id']);
                $row['cumulative_grade'] = $this->gradingService->cumulativeGrade(
                    $courseware,
                    'midterm',
                    $prelimsRow['term_grade'] ?? null,
                    $row['term_grade'],
                );

                return $row;
            })->keyBy('student_id');
        }

        return Inertia::render('professor/grades/show', [
            'courseware' => $courseware->only(['id', 'subject', 'course_code']),
            'term' => $term,
            'termWeights' => [
                'prelims_weight' => (float) $courseware->prelims_weight,
                'midterm_period_weight' => (float) $courseware->midterm_period_weight,
                'midterm_weight' => (float) $courseware->midterm_weight,
                'finals_weight' => (float) $courseware->finals_weight,
            ],
            'categories' => $categories->map(fn (GradeCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'weight' => (float) $category->weight,
                'is_quizzes' => $category->name === 'Quizzes',
                // Quizzes, Assignments, and Activities all get their items
                // from somewhere else (the Quizzes page, and graded module
                // submissions tagged by work_type) — only categories with no
                // automatic source (Recitation, Prelim Exam) let the
                // professor add/remove items by hand here.
                'is_manual' => ! in_array($category->name, self::AUTO_MANAGED_CATEGORY_NAMES, true),
                // Attendance has no discrete items to grade one by one — it's
                // a single computed rate — so it's rendered from one
                // synthetic, read-only "item" rather than real grade_items.
                'is_attendance' => $category->name === 'Attendance',
                'items' => match (true) {
                    $category->name === 'Quizzes' => $table['quizzes']->map(fn ($quiz) => ['id' => $quiz->id, 'title' => $quiz->title, 'key' => "quiz-{$quiz->id}", 'max_points' => null]),
                    $category->name === 'Attendance' => collect([['id' => $category->id, 'title' => 'Attendance Rate', 'key' => "attendance-{$category->id}", 'max_points' => null]]),
                    default => $category->items->map(fn (GradeItem $item) => ['id' => $item->id, 'title' => $item->title, 'key' => "item-{$item->id}", 'max_points' => $item->max_points]),
                },
            ]),
            'rows' => collect($table['rows'])->map(function (array $row) use ($courseware, $term, $prelimsGrades, $midtermGrades) {
                if ($term === 'prelims') {
                    $row['cumulative_grade'] = $row['term_grade'];
                } elseif ($term === 'midterm') {
                    $prelimsRow = $prelimsGrades?->get($row['student_id']);
                    $row['prelims_grade'] = $prelimsRow['term_grade'] ?? null;
                    $row['cumulative_grade'] = $this->gradingService->cumulativeGrade(
                        $courseware,
                        'midterm',
                        $row['prelims_grade'],
                        $row['term_grade'],
                    );
                } elseif ($term === 'finals') {
                    $midtermRow = $midtermGrades?->get($row['student_id']);
                    $row['midterm_grade'] = $midtermRow['cumulative_grade'] ?? null;
                    $row['cumulative_grade'] = $this->gradingService->cumulativeGrade(
                        $courseware,
                        'finals',
                        $row['midterm_grade'],
                        $row['term_grade'],
                    );
                }

                return $row;
            }),
        ]);
    }

    public function updateCategoryWeights(Request $request, Courseware $courseware, string $term): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless(in_array($term, TermGradingService::TERMS, true), 404);

        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => [
                'required',
                Rule::exists('grade_categories', 'id')->where('courseware_id', $courseware->id)->where('term', $term),
            ],
            'categories.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $total = round(collect($validated['categories'])->sum('weight'), 2);

        if (abs($total - 100.0) > 0.01) {
            return back()
                ->withErrors(['categories' => "Category weights must add up to exactly 100%. They currently add up to {$total}%."])
                ->withInput();
        }

        foreach ($validated['categories'] as $entry) {
            GradeCategory::where('id', $entry['id'])->update(['weight' => $entry['weight']]);
        }

        return Redirect::route('professor.grades.term', [$courseware, $term])
            ->with('success', 'Category weights were updated successfully.');
    }

    public function updateTermWeights(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'fold' => ['required', Rule::in(['midterm', 'finals'])],
            'previous_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'period_weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $total = round($validated['previous_weight'] + $validated['period_weight'], 2);

        if (abs($total - 100.0) > 0.01) {
            return back()
                ->withErrors(['term_weights' => "The two weights must add up to exactly 100%. They currently add up to {$total}%."])
                ->withInput();
        }

        $columns = $validated['fold'] === 'midterm'
            ? ['prelims_weight' => $validated['previous_weight'], 'midterm_period_weight' => $validated['period_weight']]
            : ['midterm_weight' => $validated['previous_weight'], 'finals_weight' => $validated['period_weight']];

        $courseware->update($columns);

        return Redirect::route('professor.grades.term', [$courseware, $validated['fold']])
            ->with('success', 'Term composition was updated successfully.');
    }

    public function storeItem(Request $request, Courseware $courseware, GradeCategory $category): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($category->courseware_id === $courseware->id, 403);
        abort_if(in_array($category->name, self::AUTO_MANAGED_CATEGORY_NAMES, true), 422);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'max_points' => ['nullable', 'integer', 'min:1'],
        ]);

        GradeItem::create([
            'grade_category_id' => $category->id,
            'title' => $validated['title'],
            'order' => $category->items()->count(),
            'max_points' => $validated['max_points'] ?? 100,
        ]);

        return Redirect::route('professor.grades.term', [$courseware, $category->term])
            ->with('success', 'Grade item was added successfully.');
    }

    public function destroyItem(Courseware $courseware, GradeItem $item): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $term = $item->category->term;
        $item->delete();

        return Redirect::route('professor.grades.term', [$courseware, $term])
            ->with('success', 'Grade item was removed successfully.');
    }

    public function updateScores(Request $request, Courseware $courseware, string $term): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless(in_array($term, TermGradingService::TERMS, true), 404);

        $studentIds = $courseware->enrollments()->pluck('student_id');
        $items = GradeItem::whereHas(
            'category',
            fn ($query) => $query->where('courseware_id', $courseware->id)->where('term', $term),
        )->get(['id', 'max_points'])->keyBy('id');

        // Quiz scores are read-only (always the actual attempt result), so
        // this only ever saves manual grade items — Recitation, Prelim Exam,
        // and the auto-created Assignment/Activity items behind a graded
        // submission.
        $validated = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*.student_id' => ['required', Rule::in($studentIds)],
            'scores.*.id' => ['required', 'integer', Rule::in($items->keys())],
            'scores.*.score' => ['nullable', 'integer', 'min:0'],
        ]);

        foreach ($validated['scores'] as $entry) {
            $item = $items->get($entry['id']);

            if (! $item) {
                continue;
            }

            if ($entry['score'] === null) {
                GradeScore::where('grade_item_id', $entry['id'])
                    ->where('student_id', $entry['student_id'])
                    ->delete();

                continue;
            }

            GradeScore::updateOrCreate(
                ['grade_item_id' => $entry['id'], 'student_id' => $entry['student_id']],
                ['score' => min($entry['score'], $item->max_points)],
            );
        }

        return Redirect::route('professor.grades.term', [$courseware, $term])
            ->with('success', 'Grades were updated successfully.');
    }

    public function export(Courseware $courseware, string $term): StreamedResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless(in_array($term, TermGradingService::TERMS, true), 404);

        $categories = $this->gradingService->categoriesForTerm($courseware, $term);
        $table = $this->gradingService->buildTermTable($courseware, $term, $categories);

        $columns = $categories->flatMap(function (GradeCategory $category) use ($table) {
            if ($category->name === 'Attendance') {
                return collect([['key' => "attendance-{$category->id}", 'label' => 'Attendance: Rate']]);
            }

            $items = $category->name === 'Quizzes' ? $table['quizzes'] : $category->items;

            return $items->map(fn ($item) => [
                'key' => $category->name === 'Quizzes' ? "quiz-{$item->id}" : "item-{$item->id}",
                'label' => "{$category->name}: {$item->title}",
            ]);
        });

        $filename = Str::slug($courseware->subject).'-'.$term.'-grades.csv';

        return response()->streamDownload(function () use ($columns, $table): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Student ID',
                'Name',
                ...$columns->pluck('label')->all(),
                'Term Grade',
            ]);

            foreach ($table['rows'] as $row) {
                fputcsv($handle, [
                    $row['student_number'] ?? '',
                    $row['name'],
                    ...$columns->map(fn ($column) => $row['item_scores'][$column['key']] ?? '')->all(),
                    $row['term_grade'] ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
