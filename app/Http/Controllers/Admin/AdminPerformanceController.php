<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\PerformancePredictionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPerformanceController extends Controller
{
    public function __construct(
        private readonly PerformancePredictionService $performancePredictionService,
    ) {}

    public function students(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $predictions = $this->performancePredictionService->predictForAllStudents();

        if ($search !== '') {
            $predictions = $predictions->filter(
                fn (array $prediction) => str_contains(
                    strtolower($prediction['student']['name']),
                    strtolower($search),
                ),
            )->values();
        }

        return Inertia::render('admin/performance/students/index', [
            'predictions' => $predictions,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(User $student): Response
    {
        abort_unless($student->role === 'student', 404);

        $prediction = $this->performancePredictionService->predictForStudent($student);

        $courses = Enrollment::query()
            ->where('student_id', $student->id)
            ->with('courseware')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'courseware' => $enrollment->courseware->only(['id', 'subject']),
                ...$this->performancePredictionService->predictForEnrollment($enrollment),
            ]);

        return Inertia::render('admin/performance/students/show', [
            'student' => $student->only(['id', 'name', 'email', 'student_id']),
            'prediction' => $prediction,
            'courses' => $courses,
        ]);
    }

    public function professors(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $predictions = $this->performancePredictionService->predictForAllProfessors();

        if ($search !== '') {
            $predictions = $predictions->filter(
                fn (array $prediction) => str_contains(
                    strtolower($prediction['professor']['name']),
                    strtolower($search),
                ),
            )->values();
        }

        return Inertia::render('admin/performance/professors/index', [
            'predictions' => $predictions,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
