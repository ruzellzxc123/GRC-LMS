<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CourseContentItem;
use App\Models\Enrollment;
use App\Models\Quiz;
use Carbon\CarbonInterface;
use Inertia\Inertia;
use Inertia\Response;

class StudentTodoController extends Controller
{
    /**
     * Google-Classroom-style "To-do": every gradable piece of work
     * (assignments/activities that require a submission, plus quizzes)
     * across all of a student's enrolled subjects, merged into one list.
     * Learning materials are excluded on purpose — there's nothing to
     * "turn in" for those, so they'd never belong in a to-do list.
     */
    public function index(): Response
    {
        $student = auth()->user();

        $coursewareIds = Enrollment::query()
            ->where('student_id', $student->id)
            ->pluck('courseware_id');

        $now = now();
        $endOfThisWeek = $now->clone()->endOfWeek();
        $endOfNextWeek = $now->clone()->addWeek()->endOfWeek();

        $bucketFor = function (?CarbonInterface $dueAt) use ($now, $endOfThisWeek, $endOfNextWeek): string {
            if ($dueAt === null) {
                return 'no_due_date';
            }

            if ($dueAt->lt($now)) {
                return 'overdue';
            }

            if ($dueAt->lte($endOfThisWeek)) {
                return 'this_week';
            }

            if ($dueAt->lte($endOfNextWeek)) {
                return 'next_week';
            }

            return 'later';
        };

        $contentItems = CourseContentItem::query()
            ->where('is_published', true)
            ->whereHas('category', function ($query) use ($coursewareIds) {
                $query->where('requires_submission', true)
                    ->whereIn('courseware_id', $coursewareIds);
            })
            ->with([
                'category.courseware',
                'submissions' => fn ($query) => $query->where('student_id', $student->id),
            ])
            ->get()
            ->map(function (CourseContentItem $item) use ($bucketFor) {
                $submission = $item->submissions->first();
                $dueAt = $item->deadline;

                return [
                    'key' => "item-{$item->id}",
                    'type' => 'assignment',
                    'title' => $item->title,
                    'subject_id' => $item->category->courseware->id,
                    'subject_name' => $item->category->courseware->subject,
                    'due_at' => $dueAt?->toIso8601String(),
                    'posted_at' => $item->created_at->toIso8601String(),
                    'completed_at' => $submission?->submitted_at?->toIso8601String(),
                    'done' => $submission !== null,
                    'bucket' => $submission === null ? $bucketFor($dueAt) : null,
                    'href' => "/student/courses/{$item->category->courseware->id}?item={$item->id}",
                ];
            });

        $quizzes = Quiz::query()
            ->where('is_published', true)
            ->whereIn('courseware_id', $coursewareIds)
            ->with([
                'courseware',
                'attempts' => fn ($query) => $query->where('student_id', $student->id),
            ])
            ->get()
            ->map(function (Quiz $quiz) use ($bucketFor) {
                $attempt = $quiz->attempts->first();
                $dueAt = $quiz->deadline;

                return [
                    'key' => "quiz-{$quiz->id}",
                    'type' => 'quiz',
                    'title' => $quiz->title,
                    'subject_id' => $quiz->courseware->id,
                    'subject_name' => $quiz->courseware->subject,
                    'due_at' => $dueAt?->toIso8601String(),
                    'posted_at' => $quiz->created_at->toIso8601String(),
                    'completed_at' => $attempt?->submitted_at?->toIso8601String(),
                    'done' => $attempt !== null,
                    'bucket' => $attempt === null ? $bucketFor($dueAt) : null,
                    'href' => "/student/quizzes/{$quiz->id}",
                ];
            });

        $items = $contentItems->concat($quizzes)->values();

        return Inertia::render('student/todo', [
            'subjects' => Enrollment::query()
                ->where('student_id', $student->id)
                ->with('courseware')
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->courseware->id,
                    'subject' => $enrollment->courseware->subject,
                ])
                ->unique('id')
                ->values(),
            'items' => $items,
        ]);
    }
}
