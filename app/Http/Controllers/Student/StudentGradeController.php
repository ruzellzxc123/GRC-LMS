<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\GradeCategory;
use App\Services\TermGradingService;
use Inertia\Inertia;
use Inertia\Response;

class StudentGradeController extends Controller
{
    public function __construct(
        private readonly TermGradingService $gradingService,
    ) {}

    public function subjects(): Response
    {
        $enrollments = Enrollment::query()
            ->where('student_id', auth()->id())
            ->with('courseware')
            ->get()
            ->sortBy(fn (Enrollment $enrollment) => $enrollment->courseware->subject)
            ->values();

        return Inertia::render('student/grades/index', [
            'subjects' => $enrollments->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->courseware->id,
                'subject' => $enrollment->courseware->subject,
            ]),
        ]);
    }

    public function show(Courseware $courseware, string $term): Response
    {
        abort_unless(in_array($term, TermGradingService::TERMS, true), 404);

        $studentId = auth()->id();

        abort_unless(
            Enrollment::where('courseware_id', $courseware->id)->where('student_id', $studentId)->exists(),
            403,
        );

        ['categories' => $categories, 'table' => $table, 'row' => $row, 'grade' => $termGrade] =
            $this->gradingService->studentTermData($courseware, $term, $studentId);

        $prelimsGrade = null;
        $midtermGrade = null;

        if ($term === 'midterm' || $term === 'finals') {
            $prelimsGrade = $this->gradingService->studentTermData($courseware, 'prelims', $studentId)['grade'];
        }

        if ($term === 'finals') {
            $midtermGrade = $this->gradingService->studentTermData($courseware, 'midterm', $studentId)['grade'];
        }

        $cumulativeGrade = $this->gradingService->overallGrade(
            $courseware,
            $term === 'prelims' ? $termGrade : $prelimsGrade,
            $term === 'midterm' ? $termGrade : $midtermGrade,
            $term === 'finals' ? $termGrade : null,
        );

        return Inertia::render('student/grades/show', [
            'courseware' => $courseware->only(['id', 'subject']),
            'term' => $term,
            'categories' => $categories->map(fn (GradeCategory $category) => $this->categoryPayload($category, $table, $row)),
            'term_grade' => $termGrade,
            'cumulative_grade' => $cumulativeGrade,
            'prelims_grade' => $prelimsGrade,
            'midterm_grade' => $midtermGrade,
        ]);
    }

    private function categoryPayload(GradeCategory $category, array $table, array $row): array
    {
        $items = match (true) {
            $category->name === 'Quizzes' => $table['quizzes']->map(fn ($quiz) => [
                'key' => "quiz-{$quiz->id}",
                'title' => $quiz->title,
                'kind' => 'quiz',
            ]),
            $category->name === 'Attendance' => collect([[
                'key' => "attendance-{$category->id}",
                'title' => 'Attendance Rate',
                'kind' => 'attendance',
            ]]),
            default => $category->items->map(fn ($item) => [
                'key' => "item-{$item->id}",
                'title' => $item->title,
                'kind' => 'item',
            ]),
        };

        return [
            'id' => $category->id,
            'name' => $category->name,
            'weight' => (float) $category->weight,
            'average' => $row['category_averages'][$category->id] ?? null,
            'items' => $items->map(fn (array $item) => [
                ...$item,
                'score' => $row['item_scores'][$item['key']] ?? null,
                'display' => $row['item_displays'][$item['key']] ?? null,
            ])->values(),
        ];
    }
}
