<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\GradeCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class PerformancePredictionService
{
    private const ATTENDANCE_WEIGHT = 0.4;

    private const ACADEMIC_WEIGHT = 0.5;

    private const PROFILE_WEIGHT = 0.1;

    private const LOW_ATTENDANCE_THRESHOLD = 75.0;

    private const LOW_ACADEMIC_THRESHOLD = 60.0;

    private const GOOD_SCORE_THRESHOLD = 70.0;

    private const EXCELLENT_SCORE_THRESHOLD = 85.0;

    private const RISK_SCORE_THRESHOLD = 50.0;

    private const PROFILE_FIELDS = ['year_level', 'section'];

    public function __construct(
        private readonly TermGradingService $gradingService,
    ) {}

    public function predictForStudent(User $student): array
    {
        $attendanceRate = $this->attendanceRate(
            Attendance::query()->whereHas('enrollment', function (Builder $query) use ($student): void {
                $query->where('student_id', $student->id);
            }),
        );

        $enrollments = Enrollment::query()
            ->where('student_id', $student->id)
            ->with('courseware')
            ->get();

        $academicAverage = $this->academicAverageAcrossEnrollments($enrollments);

        return $this->buildPrediction($attendanceRate, $academicAverage, $this->profileCompleteness($student));
    }

    public function predictForEnrollment(Enrollment $enrollment): array
    {
        $attendanceRate = $this->attendanceRate(
            Attendance::query()->where('enrollment_id', $enrollment->id),
        );

        $academicAverage = $this->academicAverageForEnrollment($enrollment);

        $student = $enrollment->relationLoaded('student')
            ? $enrollment->student
            : User::find($enrollment->student_id);

        return $this->buildPrediction($attendanceRate, $academicAverage, $this->profileCompleteness($student));
    }

    public function predictForAllStudents(): Collection
    {
        return User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get()
            ->map(fn (User $student) => [
                'student' => $student->only(['id', 'name', 'email', 'student_id']),
                ...$this->predictForStudent($student),
            ])
            ->sortBy('composite_score')
            ->values();
    }

    public function predictForProfessor(User $professor): array
    {
        $enrollments = Enrollment::query()
            ->whereHas('courseware', function (Builder $query) use ($professor): void {
                $query->where('professor_id', $professor->id);
            })
            ->get();

        if ($enrollments->isEmpty()) {
            return [
                'professor_index' => 0.0,
                'at_risk_enrollment_count' => 0,
                'student_count' => 0,
                'course_count' => 0,
            ];
        }

        $predictions = $enrollments->map(fn (Enrollment $enrollment) => $this->predictForEnrollment($enrollment));

        return [
            'professor_index' => round($predictions->avg('composite_score'), 1),
            'at_risk_enrollment_count' => $predictions
                ->filter(fn (array $prediction) => $prediction['composite_score'] < self::RISK_SCORE_THRESHOLD)
                ->count(),
            'student_count' => $enrollments->pluck('student_id')->unique()->count(),
            'course_count' => $enrollments->pluck('courseware_id')->unique()->count(),
        ];
    }

    public function predictForAllProfessors(): Collection
    {
        return User::query()
            ->where('role', 'professor')
            ->orderBy('name')
            ->get()
            ->map(fn (User $professor) => [
                'professor' => $professor->only(['id', 'name', 'email', 'department']),
                ...$this->predictForProfessor($professor),
            ])
            ->sortBy('professor_index')
            ->values();
    }

    private function buildPrediction(?float $attendanceRate, ?float $academicAverage, float $profileCompleteness): array
    {
        $compositeScore = $this->compositeScore($attendanceRate, $academicAverage, $profileCompleteness);
        $flags = $this->riskFlags($attendanceRate, $academicAverage, $profileCompleteness);

        return [
            'attendance_rate' => $attendanceRate,
            'academic_average' => $academicAverage,
            'profile_completeness' => $profileCompleteness,
            'composite_score' => $compositeScore,
            'label' => $this->label($compositeScore),
            'flags' => $flags,
            'risk_level' => $this->riskLevel($flags),
        ];
    }

    private function attendanceRate(Builder $attendanceQuery): ?float
    {
        $total = (clone $attendanceQuery)->count();

        if ($total === 0) {
            return null;
        }

        $present = (clone $attendanceQuery)->where('status', 'present')->count();

        return round($present / $total * 100, 1);
    }

    /**
     * The student's overall academic standing across every enrollment,
     * averaging each enrollment's own academicAverageForEnrollment() so no
     * single course with more graded items dominates another.
     */
    private function academicAverageAcrossEnrollments(Collection $enrollments): ?float
    {
        $values = $enrollments
            ->map(fn (Enrollment $enrollment) => $this->academicAverageForEnrollment($enrollment))
            ->filter(fn (?float $value) => $value !== null);

        return $values->isEmpty() ? null : round($values->avg(), 1);
    }

    /**
     * One enrollment's official grade so far — the same cumulative grade the
     * student sees on their own Grades page, computed from every graded
     * category (quizzes, assignments, activities, recitation, exams) via
     * TermGradingService, at whichever term is furthest along with any
     * grade recorded. Attendance is excluded here since it already has its
     * own dedicated weight in compositeScore() — folding it in again here
     * would double-count it.
     */
    private function academicAverageForEnrollment(Enrollment $enrollment): ?float
    {
        $courseware = $enrollment->relationLoaded('courseware')
            ? $enrollment->courseware
            : Courseware::find($enrollment->courseware_id);

        if (! $courseware) {
            return null;
        }

        $studentId = $enrollment->student_id;
        $termGrades = [];

        foreach (TermGradingService::TERMS as $term) {
            $termGrades[$term] = $this->nonAttendanceTermGrade($courseware, $term, $studentId);
        }

        return $this->gradingService->overallGrade(
            $courseware,
            $termGrades['prelims'],
            $termGrades['midterm'],
            $termGrades['finals'],
        );
    }

    /**
     * A term's grade recomputed from only its non-Attendance categories,
     * renormalized over their weights — the "everything but attendance"
     * counterpart to TermGradingService::buildTermTable()'s term_grade.
     */
    private function nonAttendanceTermGrade(Courseware $courseware, string $term, int $studentId): ?float
    {
        $categories = $this->gradingService->categoriesForTerm($courseware, $term)
            ->reject(fn (GradeCategory $category) => $category->name === 'Attendance');

        if ($categories->isEmpty()) {
            return null;
        }

        $table = $this->gradingService->buildTermTable($courseware, $term, $categories);
        $row = collect($table['rows'])->firstWhere('student_id', $studentId);

        if ($row === null) {
            return null;
        }

        return $this->gradingService->weightedAverage(
            $categories->map(fn (GradeCategory $category) => [
                'weight' => (float) $category->weight,
                'average' => $row['category_averages'][$category->id] ?? null,
            ]),
        );
    }

    private function profileCompleteness(User $student): float
    {
        $filled = collect(self::PROFILE_FIELDS)
            ->filter(fn (string $field) => ! empty($student->{$field}))
            ->count();

        return round($filled / count(self::PROFILE_FIELDS) * 100, 1);
    }

    private function compositeScore(?float $attendanceRate, ?float $academicAverage, float $profileCompleteness): float
    {
        $signals = ['profile' => ['weight' => self::PROFILE_WEIGHT, 'value' => $profileCompleteness]];

        if ($attendanceRate !== null) {
            $signals['attendance'] = ['weight' => self::ATTENDANCE_WEIGHT, 'value' => $attendanceRate];
        }

        if ($academicAverage !== null) {
            $signals['academic'] = ['weight' => self::ACADEMIC_WEIGHT, 'value' => $academicAverage];
        }

        $totalWeight = array_sum(array_column($signals, 'weight'));

        $score = collect($signals)->sum(fn (array $signal) => ($signal['weight'] / $totalWeight) * $signal['value']);

        return round($score, 1);
    }

    private function riskFlags(?float $attendanceRate, ?float $academicAverage, float $profileCompleteness): array
    {
        $flags = [];

        if ($attendanceRate !== null && $attendanceRate < self::LOW_ATTENDANCE_THRESHOLD) {
            $flags[] = 'low_attendance';
        }

        if ($academicAverage !== null && $academicAverage < self::LOW_ACADEMIC_THRESHOLD) {
            $flags[] = 'low_academic_performance';
        }

        if ($profileCompleteness < 100.0) {
            $flags[] = 'incomplete_profile';
        }

        return $flags;
    }

    private function riskLevel(array $flags): string
    {
        return match (true) {
            count($flags) >= 2 => 'high',
            count($flags) === 1 => 'medium',
            default => 'low',
        };
    }

    private function label(float $compositeScore): string
    {
        return match (true) {
            $compositeScore >= self::EXCELLENT_SCORE_THRESHOLD => 'Excellent',
            $compositeScore >= self::GOOD_SCORE_THRESHOLD => 'Good',
            $compositeScore >= self::RISK_SCORE_THRESHOLD => 'At Risk',
            default => 'Critical',
        };
    }
}
