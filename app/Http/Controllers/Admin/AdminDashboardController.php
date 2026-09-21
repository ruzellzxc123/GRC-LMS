<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\ContentItemSubmission;
use App\Models\Courseware;
use App\Models\User;
use App\Services\PerformancePredictionService;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly PerformancePredictionService $performancePredictionService,
    ) {}

    public function __invoke(): Response
    {
        $totalStudents = User::query()
            ->where('role', 'student')
            ->count();

        $atRiskStudents = User::query()
            ->where('role', 'student')
            ->where(function ($query) {
                $query->whereNull('program')
                    ->orWhereNull('year_level')
                    ->orWhereNull('section');
            })
            ->count();

        // "Current" is derived from today's date falling within the term's
        // span rather than a manual flag — if more than one term somehow
        // overlaps, the most recently started one wins.
        $currentTerm = Schema::hasTable('academic_terms')
            ? AcademicTerm::query()
                ->whereDate('start_date', '<=', now())
                ->whereDate('end_date', '>=', now())
                ->orderByDesc('start_date')
                ->first()
            : null;

        $predictions = $this->performancePredictionService->predictForAllStudents();

        $averageCompositeScore = $predictions->isNotEmpty()
            ? round($predictions->avg('composite_score'), 1)
            : null;

        $riskCounts = [
            'low' => $predictions->where('risk_level', 'low')->count(),
            'medium' => $predictions->where('risk_level', 'medium')->count(),
            'high' => $predictions->where('risk_level', 'high')->count(),
        ];

        $flagCounts = [
            'low_attendance' => $predictions->filter(fn (array $p) => in_array('low_attendance', $p['flags'], true))->count(),
            'low_quiz_performance' => $predictions->filter(fn (array $p) => in_array('low_quiz_performance', $p['flags'], true))->count(),
            'incomplete_profile' => $predictions->filter(fn (array $p) => in_array('incomplete_profile', $p['flags'], true))->count(),
        ];

        $needsAttention = $predictions->take(5)->map(fn (array $p) => [
            'id' => $p['student']['id'],
            'name' => $p['student']['name'],
            'composite_score' => $p['composite_score'],
            'label' => $p['label'],
            'risk_level' => $p['risk_level'],
        ])->values();

        $pendingGradingCount = ContentItemSubmission::query()->whereNull('graded_at')->count();

        $recentStudents = User::query()
            ->where('role', 'student')
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'created_at']);

        $recentCourses = Courseware::query()
            ->latest()
            ->limit(5)
            ->get(['id', 'subject', 'professor', 'created_at']);

        $recentGraded = ContentItemSubmission::query()
            ->whereNotNull('graded_at')
            ->with('student:id,name')
            ->latest('graded_at')
            ->limit(5)
            ->get();

        $activity = collect()
            ->concat($recentStudents->map(fn (User $student) => [
                'type' => 'student',
                'title' => "New student: {$student->name}",
                'meta' => null,
                'at' => $student->created_at,
            ]))
            ->concat($recentCourses->map(fn (Courseware $course) => [
                'type' => 'course',
                'title' => "New subject: {$course->subject}",
                'meta' => $course->professor,
                'at' => $course->created_at,
            ]))
            ->concat($recentGraded->map(fn (ContentItemSubmission $submission) => [
                'type' => 'grade',
                'title' => "Graded submission for {$submission->student->name}",
                'meta' => $submission->score !== null ? "{$submission->score}%" : null,
                'at' => $submission->graded_at,
            ]))
            ->sortByDesc('at')
            ->take(6)
            ->values()
            ->map(fn (array $entry) => [...$entry, 'at' => $entry['at']->toIso8601String()]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_students' => $totalStudents,
                'total_professors' => User::query()->where('role', 'professor')->count(),
                'total_courses' => Courseware::query()->count(),
                'students_at_risk_percentage' => $totalStudents > 0
                    ? (int) round(($atRiskStudents / $totalStudents) * 100)
                    : 0,
                'current_term' => $currentTerm?->name,
            ],
            'institution' => [
                'average_composite_score' => $averageCompositeScore,
                'risk_counts' => $riskCounts,
                'flag_counts' => $flagCounts,
                'pending_grading_count' => $pendingGradingCount,
            ],
            'needs_attention' => $needsAttention,
            'recent_activity' => $activity,
            'students' => User::query()
                ->where('role', 'student')
                ->orderBy('name')
                ->limit(8)
                ->get([
                    'id',
                    'name',
                    'student_id',
                    'email',
                    'program',
                    'year_level',
                    'section',
                ]),

            'recent_courses' => Courseware::query()
                ->latest()
                ->limit(4)
                ->get([
                    'id',
                    'subject',
                    'professor',
                    'module_title',
                    'created_at',
                ]),
        ]);
    }
}
