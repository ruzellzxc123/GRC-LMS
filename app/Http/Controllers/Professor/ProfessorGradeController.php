<?php

namespace App\Http\Controllers\Professor;

use App\Events\CourseContentUpdated;
use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
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
            $midtermGrades = collect($midtermTable['rows'])->keyBy('student_id');
        }

        return Inertia::render('professor/grades/show', [
            'courseware' => $courseware->only(['id', 'subject']),
            'term' => $term,
            'termWeights' => [
                'prelims_weight' => (float) $courseware->prelims_weight,
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
                    $row['cumulative_grade'] = $this->gradingService->overallGrade($courseware, $row['term_grade'], null, null);
                } elseif ($term === 'midterm') {
                    $prelimsRow = $prelimsGrades?->get($row['student_id']);
                    $row['prelims_grade'] = $prelimsRow['term_grade'] ?? null;
                    $row['cumulative_grade'] = $this->gradingService->overallGrade($courseware, $row['prelims_grade'], $row['term_grade'], null);
                } elseif ($term === 'finals') {
                    $prelimsRow = $prelimsGrades?->get($row['student_id']);
                    $midtermRow = $midtermGrades?->get($row['student_id']);
                    $row['prelims_grade'] = $prelimsRow['term_grade'] ?? null;
                    $row['midterm_grade'] = $midtermRow['term_grade'] ?? null;
                    $row['cumulative_grade'] = $this->gradingService->overallGrade($courseware, $row['prelims_grade'], $row['midterm_grade'], $row['term_grade']);
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

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.grades.term', [$courseware, $term])
            ->with('success', 'Category weights were updated successfully.');
    }

    public function updateTermWeights(Request $request, Courseware $courseware): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $validated = $request->validate([
            'term' => ['required', Rule::in(TermGradingService::TERMS)],
            'prelims_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'midterm_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'finals_weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $total = round($validated['prelims_weight'] + $validated['midterm_weight'] + $validated['finals_weight'], 2);

        if (abs($total - 100.0) > 0.01) {
            return back()
                ->withErrors(['term_weights' => "Prelims, Midterm, and Finals must add up to exactly 100%. They currently add up to {$total}%."])
                ->withInput();
        }

        $courseware->update([
            'prelims_weight' => $validated['prelims_weight'],
            'midterm_weight' => $validated['midterm_weight'],
            'finals_weight' => $validated['finals_weight'],
        ]);

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.grades.term', [$courseware, $validated['term']])
            ->with('success', 'Term weights were updated successfully.');
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

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.grades.term', [$courseware, $category->term])
            ->with('success', 'Grade item was added successfully.');
    }

    public function destroyItem(Courseware $courseware, GradeItem $item): RedirectResponse
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);
        abort_unless($item->category->courseware_id === $courseware->id, 403);

        $term = $item->category->term;
        $item->delete();

        CourseContentUpdated::dispatchSafely($courseware->id);

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
        )->get(['id', 'max_points', 'course_content_item_id'])->keyBy('id');

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

                $this->syncScoreToSubmission($item, $entry['student_id'], null);

                continue;
            }

            $score = min($entry['score'], $item->max_points);

            GradeScore::updateOrCreate(
                ['grade_item_id' => $entry['id'], 'student_id' => $entry['student_id']],
                ['score' => $score],
            );

            $this->syncScoreToSubmission($item, $entry['student_id'], $score);
        }

        CourseContentUpdated::dispatchSafely($courseware->id);

        return Redirect::route('professor.grades.term', [$courseware, $term])
            ->with('success', 'Grades were updated successfully.');
    }

    /**
     * The other half of the sync: a score edited here in the gradebook, for
     * an item that was originally auto-populated from a graded submission,
     * writes back to that submission too — so the Submissions tab never
     * shows a stale number after the gradebook was the one actually edited.
     * A no-op for items with no linked submission (Recitation, Prelim Exam)
     * or where the student never actually submitted anything to update.
     */
    private function syncScoreToSubmission(GradeItem $item, int $studentId, ?int $score): void
    {
        if ($item->course_content_item_id === null) {
            return;
        }

        $submission = ContentItemSubmission::where('course_content_item_id', $item->course_content_item_id)
            ->where('student_id', $studentId)
            ->first();

        if (! $submission) {
            return;
        }

        $submission->update([
            'score' => $score,
            'graded_at' => $score !== null ? now() : null,
        ]);
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
