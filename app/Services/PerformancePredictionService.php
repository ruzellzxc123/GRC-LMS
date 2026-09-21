<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class PerformancePredictionService
{
    private const ATTENDANCE_WEIGHT = 0.4;

    private const QUIZ_WEIGHT = 0.5;

    private const PROFILE_WEIGHT = 0.1;

    private const LOW_ATTENDANCE_THRESHOLD = 75.0;

    private const LOW_QUIZ_THRESHOLD = 60.0;

    private const GOOD_SCORE_THRESHOLD = 70.0;

    private const EXCELLENT_SCORE_THRESHOLD = 85.0;

    private const RISK_SCORE_THRESHOLD = 50.0;

    private const PROFILE_FIELDS = ['program', 'year_level', 'section'];

    public function predictForStudent(User $student): array
    {
        $attendanceRate = $this->attendanceRate(
            Attendance::query()->whereHas('enrollment', function (Builder $query) use ($student): void {
                $query->where('student_id', $student->id);
            }),
        );

        $quizAverage = $this->quizScoreAverage(
            QuizAttempt::query()->where('student_id', $student->id),
        );

        return $this->buildPrediction($attendanceRate, $quizAverage, $this->profileCompleteness($student));
    }

    public function predictForEnrollment(Enrollment $enrollment): array
    {
        $attendanceRate = $this->attendanceRate(
            Attendance::query()->where('enrollment_id', $enrollment->id),
        );

        $quizAverage = $this->quizScoreAverage(
            QuizAttempt::query()
                ->where('student_id', $enrollment->student_id)
                ->whereHas('quiz', function (Builder $query) use ($enrollment): void {
                    $query->where('courseware_id', $enrollment->courseware_id);
                }),
        );

        $student = $enrollment->relationLoaded('student')
            ? $enrollment->student
            : User::find($enrollment->student_id);

        return $this->buildPrediction($attendanceRate, $quizAverage, $this->profileCompleteness($student));
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

    private function buildPrediction(?float $attendanceRate, ?float $quizAverage, float $profileCompleteness): array
    {
        $compositeScore = $this->compositeScore($attendanceRate, $quizAverage, $profileCompleteness);
        $flags = $this->riskFlags($attendanceRate, $quizAverage, $profileCompleteness);

        return [
            'attendance_rate' => $attendanceRate,
            'quiz_average' => $quizAverage,
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

    private function quizScoreAverage(Builder $attemptsQuery): ?float
    {
        $attempts = (clone $attemptsQuery)
            ->whereNotNull('submitted_at')
            ->get(['total_questions', 'correct_count']);

        if ($attempts->isEmpty()) {
            return null;
        }

        $average = $attempts->avg(fn ($attempt) => $attempt->total_questions > 0
            ? $attempt->correct_count / $attempt->total_questions * 100
            : 0);

        return round($average, 1);
    }

    private function profileCompleteness(User $student): float
    {
        $filled = collect(self::PROFILE_FIELDS)
            ->filter(fn (string $field) => ! empty($student->{$field}))
            ->count();

        return round($filled / count(self::PROFILE_FIELDS) * 100, 1);
    }

    private function compositeScore(?float $attendanceRate, ?float $quizAverage, float $profileCompleteness): float
    {
        $signals = ['profile' => ['weight' => self::PROFILE_WEIGHT, 'value' => $profileCompleteness]];

        if ($attendanceRate !== null) {
            $signals['attendance'] = ['weight' => self::ATTENDANCE_WEIGHT, 'value' => $attendanceRate];
        }

        if ($quizAverage !== null) {
            $signals['quiz'] = ['weight' => self::QUIZ_WEIGHT, 'value' => $quizAverage];
        }

        $totalWeight = array_sum(array_column($signals, 'weight'));

        $score = collect($signals)->sum(fn (array $signal) => ($signal['weight'] / $totalWeight) * $signal['value']);

        return round($score, 1);
    }

    private function riskFlags(?float $attendanceRate, ?float $quizAverage, float $profileCompleteness): array
    {
        $flags = [];

        if ($attendanceRate !== null && $attendanceRate < self::LOW_ATTENDANCE_THRESHOLD) {
            $flags[] = 'low_attendance';
        }

        if ($quizAverage !== null && $quizAverage < self::LOW_QUIZ_THRESHOLD) {
            $flags[] = 'low_quiz_performance';
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
