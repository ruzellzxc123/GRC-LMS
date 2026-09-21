<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Courseware;
use App\Models\GradeCategory;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Collection;

final class TermGradingService
{
    public const TERMS = ['prelims', 'midterm', 'finals'];

    /**
     * Default categories auto-created the first time a term's grade page is
     * opened, split evenly so weights always start at exactly 100%. Only
     * Prelims carries the Prelim Exam category — Midterm and Finals build on
     * the cumulative grade of the period before them instead.
     */
    private const DEFAULT_CATEGORIES = [
        'prelims' => ['Assignments', 'Quizzes', 'Activities', 'Recitation', 'Attendance', 'Prelim Exam'],
        'midterm' => ['Assignments', 'Quizzes', 'Activities', 'Recitation', 'Attendance'],
        'finals' => ['Assignments', 'Quizzes', 'Activities', 'Recitation', 'Attendance'],
    ];

    /**
     * Categories for a term, auto-provisioned with evenly-split weights the
     * first time they're requested. Each category's `items` relation is
     * loaded; for the "Quizzes" category, items are populated from the
     * subject's quizzes tagged with this term instead of manual grade_items.
     * A term whose categories already exist (created before a new default
     * category, e.g. Attendance, was introduced) gets just that one
     * backfilled at 0% — its weight is never guessed for the professor, since
     * only they know how to fairly re-split it against the existing ones.
     */
    public function categoriesForTerm(Courseware $courseware, string $term): Collection
    {
        $categories = GradeCategory::where('courseware_id', $courseware->id)
            ->where('term', $term)
            ->with('items')
            ->get();

        if ($categories->isEmpty()) {
            return $this->createDefaultCategories($courseware, $term);
        }

        $missingNames = array_diff(self::DEFAULT_CATEGORIES[$term], $categories->pluck('name')->all());

        if (! empty($missingNames)) {
            $backfilled = collect($missingNames)->map(fn (string $name) => GradeCategory::create([
                'courseware_id' => $courseware->id,
                'term' => $term,
                'name' => $name,
                'weight' => 0,
            ]));

            $categories = $categories->concat($backfilled);
        }

        if ($categories->contains(fn (GradeCategory $category) => $category->weight === null)) {
            $categories = $this->evenlySplitWeights($categories);
        }

        return $categories->sortBy('id')->values();
    }

    private function createDefaultCategories(Courseware $courseware, string $term): Collection
    {
        $names = self::DEFAULT_CATEGORIES[$term];

        $categories = collect($names)->map(fn (string $name) => GradeCategory::create([
            'courseware_id' => $courseware->id,
            'term' => $term,
            'name' => $name,
        ]));

        return $this->evenlySplitWeights($categories);
    }

    private function evenlySplitWeights(Collection $categories): Collection
    {
        $count = $categories->count();

        if ($count === 0) {
            return $categories;
        }

        $base = floor(10000 / $count) / 100;
        $remainder = round(100 - $base * $count, 2);

        $categories->values()->each(function (GradeCategory $category, int $index) use ($base, $remainder, $count): void {
            if ($category->weight === null) {
                $category->weight = $index === $count - 1 ? round($base + $remainder, 2) : $base;
                $category->save();
            }
        });

        return $categories;
    }

    /**
     * The quizzes that stand in as this term's "Quizzes" category items.
     */
    public function quizzesForTerm(Courseware $courseware, string $term): Collection
    {
        return Quiz::where('courseware_id', $courseware->id)
            ->where('term', $term)
            ->orderBy('id')
            ->get(['id', 'title']);
    }

    /**
     * Resolve one student's percentage score on a manual grade item — the
     * raw points they earned (e.g. 42) divided by that item's own total
     * (e.g. 50), not always literally out of 100.
     */
    public function itemScore(GradeItem $item, int $studentId, Collection $scores): ?float
    {
        $score = $scores->get($studentId.'-'.$item->id);

        if ($score === null) {
            return null;
        }

        $maxPoints = $item->max_points ?: 100;

        return round(((float) $score->score / $maxPoints) * 100, 2);
    }

    /**
     * "42/50" style display for a manual grade item cell — the raw points
     * earned against that item's own total, not the computed percentage.
     */
    public function itemScoreDisplay(GradeItem $item, int $studentId, Collection $scores): ?string
    {
        $score = $scores->get($studentId.'-'.$item->id);

        if ($score === null) {
            return null;
        }

        $maxPoints = $item->max_points ?: 100;
        $raw = rtrim(rtrim(number_format((float) $score->score, 2, '.', ''), '0'), '.');

        return "{$raw}/{$maxPoints}";
    }

    /**
     * Resolve one student's percentage score on a quiz — always the actual
     * attempt score, computed straight from the questions answered. Quiz
     * grades are read-only in the gradebook, with no manual override.
     */
    public function quizScore(int $quizId, int $studentId, Collection $attempts): ?float
    {
        return $attempts->get($studentId.'-'.$quizId)?->score;
    }

    /**
     * The raw correct/total count from the student's actual quiz attempt —
     * always the real attempt facts, even when a professor has overridden
     * the score used for grading, so overriding a quiz never makes this
     * caption misrepresent what the override itself is (a typed-in number
     * that has no natural "out of X" of its own, unlike a graded attempt).
     * Null when the student hasn't attempted the quiz at all.
     */
    public function quizScoreDisplay(int $quizId, int $studentId, Collection $attempts): ?string
    {
        $attempt = $attempts->get($studentId.'-'.$quizId);

        return $attempt === null ? null : "{$attempt->correct_count}/{$attempt->total_questions}";
    }

    /**
     * "8/10 days" style display for the Attendance item cell, alongside its
     * computed percentage rate.
     */
    public function attendanceDisplay(int $studentId, Collection $recordsByStudent): ?string
    {
        $raw = $this->attendanceRaw($studentId, $recordsByStudent);

        return $raw === null ? null : "{$raw[0]}/{$raw[1]} days";
    }

    /**
     * Weighted average across a set of {weight, average} rows, renormalized
     * over whichever categories actually have a graded score yet.
     */
    public function weightedAverage(Collection $weightedAverages): ?float
    {
        $graded = $weightedAverages->filter(fn (array $row) => $row['average'] !== null);

        if ($graded->isEmpty()) {
            return null;
        }

        $totalWeight = $graded->sum('weight');

        if ($totalWeight <= 0) {
            return null;
        }

        return round(
            $graded->sum(fn (array $row) => ($row['weight'] / $totalWeight) * $row['average']),
            2,
        );
    }

    /**
     * The official grade for Midterm or Finals: a weighted composite of the
     * previous period's cumulative grade and this period's own grade, using
     * the subject's configured split for that fold. Prelims has no previous
     * period, so its own period grade is already the official grade.
     */
    public function cumulativeGrade(Courseware $courseware, string $term, ?float $previousGrade, ?float $periodGrade): ?float
    {
        if ($term === 'prelims') {
            return $periodGrade;
        }

        if ($previousGrade === null && $periodGrade === null) {
            return null;
        }

        if ($periodGrade === null) {
            return $previousGrade;
        }

        if ($previousGrade === null) {
            return $periodGrade;
        }

        [$previousWeight, $periodWeight] = match ($term) {
            'midterm' => [(float) $courseware->prelims_weight, (float) $courseware->midterm_period_weight],
            'finals' => [(float) $courseware->midterm_weight, (float) $courseware->finals_weight],
            default => [0.0, 0.0],
        };

        return round(
            ($previousWeight / 100 * $previousGrade) + ($periodWeight / 100 * $periodGrade),
            2,
        );
    }


    public function enrolledStudents(Courseware $courseware): Collection
    {
        return $courseware->enrollments()
            ->with('student')
            ->get()
            ->pluck('student')
            ->sortBy('name')
            ->values();
    }

    public function quizAttemptsFor(Collection $quizzes): Collection
    {
        return QuizAttempt::whereIn('quiz_id', $quizzes->pluck('id'))
            ->whereNotNull('submitted_at')
            ->get()
            ->keyBy(fn (QuizAttempt $attempt) => $attempt->student_id.'-'.$attempt->quiz_id);
    }

    public function gradeScoresFor(Collection $categories): Collection
    {
        $itemIds = $categories->flatMap(fn (GradeCategory $category) => $category->items->pluck('id'));

        return GradeScore::whereIn('grade_item_id', $itemIds)
            ->get()
            ->keyBy(fn ($score) => $score->student_id.'-'.$score->grade_item_id);
    }

    /**
     * Every attendance record within a term's date range (from the subject's
     * academic term — the same prelims/midterm/finals windows used for week
     * numbering elsewhere), grouped by student so attendanceRate() can look
     * a student up without a query per row.
     */
    public function attendanceRecordsByStudent(Courseware $courseware, string $term): Collection
    {
        $academicTerm = $courseware->academicTerm;

        if (! $academicTerm) {
            return collect();
        }

        $start = $academicTerm->{"{$term}_start"};
        $end = $academicTerm->{"{$term}_end"};

        if (! $start || ! $end) {
            return collect();
        }

        return Attendance::whereHas(
            'enrollment',
            fn ($query) => $query->where('courseware_id', $courseware->id),
        )
            ->whereBetween('date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->with('enrollment')
            ->get()
            ->groupBy(fn (Attendance $attendance) => $attendance->enrollment->student_id);
    }

    /**
     * One student's attendance rate for the term: the share of countable
     * days (present or late) out of all marked days, excluding excused ones
     * entirely so an excused absence doesn't count against the student.
     * Null if nothing has been marked yet, matching every other category's
     * "not graded yet" state.
     */
    public function attendanceRate(int $studentId, Collection $recordsByStudent): ?float
    {
        $raw = $this->attendanceRaw($studentId, $recordsByStudent);

        return $raw === null ? null : round($raw[0] / $raw[1] * 100, 2);
    }

    /**
     * The raw [days attended, countable days] pair behind attendanceRate() —
     * kept alongside the percentage so the UI can display "8/10 days" rather
     * than just the computed rate. Null under the same condition as
     * attendanceRate(): nothing countable has been marked yet.
     */
    public function attendanceRaw(int $studentId, Collection $recordsByStudent): ?array
    {
        $records = $recordsByStudent->get($studentId, collect());
        $countable = $records->where('status', '!=', 'excused');

        if ($countable->isEmpty()) {
            return null;
        }

        $attended = $countable->whereIn('status', ['present', 'late'])->count();

        return [$attended, $countable->count()];
    }

    /**
     * Build the full term grade table: one row per student with each
     * category's average and the overall term grade.
     */
    public function buildTermTable(Courseware $courseware, string $term, Collection $categories): array
    {
        $students = $this->enrolledStudents($courseware);
        $quizzes = $this->quizzesForTerm($courseware, $term);
        $attempts = $this->quizAttemptsFor($quizzes);
        $manualScores = $this->gradeScoresFor($categories);
        $attendanceByStudent = $this->attendanceRecordsByStudent($courseware, $term);

        $rows = $students->map(function (User $student) use ($categories, $quizzes, $attempts, $manualScores, $attendanceByStudent) {
            $categoryAverages = [];
            $itemScores = [];
            $itemDisplays = [];

            foreach ($categories as $category) {
                if ($category->name === 'Quizzes') {
                    $scores = $quizzes->map(
                        fn (Quiz $quiz) => $this->quizScore($quiz->id, $student->id, $attempts),
                    );
                } elseif ($category->name === 'Attendance') {
                    $scores = collect([$this->attendanceRate($student->id, $attendanceByStudent)]);
                } else {
                    $scores = $category->items->map(
                        fn (GradeItem $item) => $this->itemScore($item, $student->id, $manualScores),
                    );
                }

                foreach ($scores as $index => $score) {
                    $itemKey = match (true) {
                        $category->name === 'Quizzes' => 'quiz-'.$quizzes[$index]->id,
                        $category->name === 'Attendance' => 'attendance-'.$category->id,
                        default => 'item-'.$category->items[$index]->id,
                    };
                    $itemScores[$itemKey] = $score;
                    $itemDisplays[$itemKey] = match (true) {
                        $category->name === 'Quizzes' => $this->quizScoreDisplay($quizzes[$index]->id, $student->id, $attempts),
                        $category->name === 'Attendance' => $this->attendanceDisplay($student->id, $attendanceByStudent),
                        default => $this->itemScoreDisplay($category->items[$index], $student->id, $manualScores),
                    };
                }

                $graded = $scores->filter(fn ($score) => $score !== null);
                $categoryAverages[$category->id] = $graded->isEmpty() ? null : round($graded->avg(), 2);
            }

            $termGrade = $this->weightedAverage(
                $categories->map(fn (GradeCategory $category) => [
                    'weight' => (float) $category->weight,
                    'average' => $categoryAverages[$category->id],
                ]),
            );

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'student_number' => $student->student_id,
                'item_scores' => $itemScores,
                'item_displays' => $itemDisplays,
                'category_averages' => $categoryAverages,
                'term_grade' => $termGrade,
            ];
        })->values();

        return [
            'quizzes' => $quizzes,
            'rows' => $rows,
        ];
    }
}
