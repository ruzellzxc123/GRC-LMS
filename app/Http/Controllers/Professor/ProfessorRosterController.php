<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\ContentItemSubmission;
use App\Models\Courseware;
use App\Services\PerformancePredictionService;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorRosterController extends Controller
{
    public function __construct(
        private readonly PerformancePredictionService $performancePredictionService,
    ) {}

    public function index(Courseware $courseware): Response
    {
        abort_unless($courseware->professor_id === auth()->id(), 403);

        $enrollments = $courseware->enrollments()
            ->with('student')
            ->get();

        $roster = $enrollments->map(function ($enrollment) {
            $prediction = $this->performancePredictionService->predictForEnrollment($enrollment);

            return [
                'enrollment_id' => $enrollment->id,
                'student' => $enrollment->student->only(['id', 'name', 'email', 'student_id']),
                'attendance_rate' => $prediction['attendance_rate'],
                'academic_average' => $prediction['academic_average'],
                'composite_score' => $prediction['composite_score'],
                'label' => $prediction['label'],
                'risk_level' => $prediction['risk_level'],
            ];
        })
            ->sortBy('composite_score')
            ->values();

        $withAttendanceData = $roster->filter(fn (array $row) => $row['attendance_rate'] !== null);
        $withAcademicData = $roster->filter(fn (array $row) => $row['academic_average'] !== null);

        $submissions = ContentItemSubmission::query()
            ->whereHas('item.category', fn ($query) => $query->where('courseware_id', $courseware->id))
            ->with(['student:id,name', 'item:id,title,max_points'])
            ->orderByRaw('COALESCE(graded_at, acknowledged_at, submitted_at) DESC')
            ->get();

        $gradingStatus = fn (ContentItemSubmission $submission) => match (true) {
            $submission->graded_at !== null => 'graded',
            $submission->acknowledged_at !== null => 'reviewed',
            default => 'awaiting',
        };

        return Inertia::render('professor/roster', [
            'courseware' => [
                ...$courseware->only(['id', 'subject', 'meeting_link']),
                'effective_meeting_link' => $courseware->meetingUrl(),
                'uses_embedded_meeting' => $courseware->usesEmbeddedMeeting(),
            ],
            'roster' => $roster,
            'summary' => [
                'student_count' => $roster->count(),
                'avg_attendance' => $withAttendanceData->isEmpty() ? null : round($withAttendanceData->avg('attendance_rate'), 1),
                'avg_academic_score' => $withAcademicData->isEmpty() ? null : round($withAcademicData->avg('academic_average'), 1),
                'at_risk_count' => $roster->filter(fn (array $row) => $row['risk_level'] === 'high')->count(),
            ],
            'grading' => [
                'awaiting_count' => $submissions->filter(fn (ContentItemSubmission $submission) => $gradingStatus($submission) === 'awaiting')->count(),
                'reviewed_count' => $submissions->filter(fn (ContentItemSubmission $submission) => $gradingStatus($submission) === 'reviewed')->count(),
                'graded_count' => $submissions->filter(fn (ContentItemSubmission $submission) => $gradingStatus($submission) === 'graded')->count(),
                'recent' => $submissions->take(8)->map(fn (ContentItemSubmission $submission) => [
                    'id' => $submission->id,
                    'student_name' => $submission->student->name,
                    'item_title' => $submission->item->title,
                    'status' => $gradingStatus($submission),
                    'score' => $submission->score !== null
                        ? round($submission->score / $submission->item->max_points * 100)
                        : null,
                    'submitted_at' => $submission->submitted_at->toIso8601String(),
                ])->values(),
            ],
        ]);
    }
}
