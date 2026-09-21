<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ContentItemView;
use App\Models\CourseContentItem;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentQuizController extends Controller
{
    public function show(Quiz $quiz): Response
    {
        $this->authorizeAccess($quiz);

        $attempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', auth()->id())
            ->first();

        // Only a first-time attempt is gated by the deadline — one already in
        // progress (e.g. a timer that started before the deadline hit) is
        // left alone so it can still be finished and graded.
        if (! $attempt && $quiz->isPastDeadline() && ! $quiz->hasLateExceptionFor(auth()->id())) {
            return Inertia::render('student/quizzes/blocked', [
                'quiz' => $quiz->only(['id', 'title', 'description']),
                'deadline' => $quiz->deadline->toIso8601String(),
            ]);
        }

        if (! $attempt) {
            // Each attempt snapshots its own subset of questions (when the
            // quiz asks for fewer than the full bank) so that reloading the
            // page, grading, and the results screen all stay consistent for
            // that one attempt, even though other students got a different
            // subset.
            $selectedQuestionIds = $quiz->selectQuestionIdsForAttempt();

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'student_id' => auth()->id(),
                'total_questions' => $selectedQuestionIds !== null ? count($selectedQuestionIds) : $quiz->questions()->count(),
                'correct_count' => 0,
                'started_at' => now(),
                'submitted_at' => null,
                'selected_question_ids' => $selectedQuestionIds,
            ]);
        }

        if (! $attempt->submitted_at && $quiz->timing_mode === 'timer' && $quiz->time_limit_minutes) {
            $expiresAt = $attempt->started_at->clone()->addMinutes($quiz->time_limit_minutes);

            if (now()->greaterThanOrEqualTo($expiresAt)) {
                $attempt->update(['submitted_at' => $expiresAt]);
            }
        }

        if ($attempt->submitted_at) {
            $attempt->load(['responses.question', 'responses.option']);

            return Inertia::render('student/quizzes/results', [
                'quiz' => $quiz->only(['id', 'title', 'description']),
                'attempt' => [
                    'correct_count' => $attempt->correct_count,
                    'total_questions' => $attempt->total_questions,
                    'score' => $attempt->score,
                    'duration_seconds' => $attempt->duration_seconds,
                    'auto_submitted' => $attempt->responses->isEmpty() && $attempt->total_questions > 0,
                ],
                'responses' => $attempt->responses->map(fn ($response) => [
                    'question' => $response->question->question,
                    'chosen_option' => $response->option->option_text,
                    'is_correct' => $response->is_correct,
                ]),
            ]);
        }

        return Inertia::render('student/quizzes/take', [
            'quiz' => $quiz->only(['id', 'title', 'description']),
            'timing' => [
                'mode' => $quiz->timing_mode,
                'started_at' => $attempt->started_at->toIso8601String(),
                'expires_at' => $quiz->timing_mode === 'timer' && $quiz->time_limit_minutes
                    ? $attempt->started_at->clone()->addMinutes($quiz->time_limit_minutes)->toIso8601String()
                    : null,
            ],
            'questions' => $quiz->questionsForAttempt($attempt)->map(fn ($question) => [
                'id' => $question->id,
                'question' => $question->question,
                'options' => $question->options->map(fn ($option) => [
                    'id' => $option->id,
                    'option_text' => $option->option_text,
                ]),
            ]),
        ]);
    }

    public function store(Request $request, Quiz $quiz): RedirectResponse
    {
        $this->authorizeAccess($quiz);

        $attempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', auth()->id())
            ->first();

        abort_if(! $attempt || $attempt->submitted_at, 409);

        // Grade only against this attempt's own assigned subset — never the
        // full bank — so a submitted answer for a question outside it (e.g.
        // a crafted request) can't be accepted.
        $questions = $quiz->questionsForAttempt($attempt);

        // "required" only when this question was actually answered — a
        // timer auto-submit can arrive with some (or all) questions still
        // blank, and those should just count as wrong, not fail validation.
        $validated = $request->validate([
            'answers' => ['nullable', 'array'],
        ] + collect($questions)->mapWithKeys(fn ($question) => [
            "answers.{$question->id}" => [
                'nullable',
                Rule::exists('quiz_options', 'id')->where('quiz_question_id', $question->id),
            ],
        ])->all());

        $attempt = DB::transaction(function () use ($attempt, $questions, $validated) {
            $correctCount = 0;
            $answers = $validated['answers'] ?? [];

            foreach ($questions as $question) {
                $chosenOptionId = $answers[$question->id] ?? null;

                if ($chosenOptionId === null) {
                    continue;
                }

                $chosenOption = $question->options->firstWhere('id', (int) $chosenOptionId);

                if ($chosenOption->is_correct) {
                    $correctCount++;
                }

                $attempt->responses()->create([
                    'quiz_question_id' => $question->id,
                    'quiz_option_id' => $chosenOption->id,
                    'is_correct' => $chosenOption->is_correct,
                ]);
            }

            $attempt->update([
                'correct_count' => $correctCount,
                'submitted_at' => now(),
            ]);

            return $attempt;
        });

        return Redirect::route('student.quizzes.show', $quiz)
            ->with('success', "You scored {$attempt->score}%.");
    }

    private function authorizeAccess(Quiz $quiz): void
    {
        abort_unless($quiz->is_published, 403);

        abort_unless(
            Enrollment::query()
                ->where('courseware_id', $quiz->courseware_id)
                ->where('student_id', auth()->id())
                ->exists(),
            403,
        );

        // A quiz attached to a module (the professor's "Add Quiz" flow) only
        // unlocks once the student has actually finished reading that
        // module — enforced here too, not just hidden in the UI, so it can't
        // be bypassed by visiting the quiz URL directly.
        $linkedItem = CourseContentItem::where('quiz_id', $quiz->id)->first();

        if ($linkedItem) {
            $finishedReading = ContentItemView::where('course_content_item_id', $linkedItem->id)
                ->where('student_id', auth()->id())
                ->whereNotNull('finished_at')
                ->exists();

            abort_unless($finishedReading, 403);
        }
    }
}
