<?php

namespace App\Http\Controllers\Professor;

use App\Http\Controllers\Controller;
use App\Models\CourseContentItem;
use App\Models\Courseware;
use App\Models\Enrollment;
use App\Models\LateException;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\QuizImportParser;
use App\Services\TermGradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator as ValidatorFacade;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorQuizController extends Controller
{
    private const TIMING_MODES = ['timestamp', 'timer'];

    public function index(): Response
    {
        $quizzes = Quiz::query()
            ->whereHas('courseware', function ($query): void {
                $query->where('professor_id', auth()->id());
            })
            ->with('courseware')
            ->withCount(['questions', 'attempts'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('professor/quizzes/index', [
            'quizzes' => $quizzes,
        ]);
    }

    public function create(Request $request): Response
    {
        $lockedItem = $this->resolveLockedModule($request->query('content_item_id'));

        return Inertia::render('professor/quizzes/create', [
            'courses' => Courseware::query()
                ->where('professor_id', auth()->id())
                ->orderBy('subject')
                ->get(['id', 'subject']),
            'content_item_id' => $lockedItem?->id,
            'courseware_id' => $lockedItem?->category->courseware_id ?? $request->query('courseware_id'),
            'locked_subject' => $lockedItem?->category->courseware->subject,
            'locked_term' => $lockedItem ? strtolower($lockedItem->category->name) : null,
            'available_modules' => $this->availableModulesFor($lockedItem),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $lockedItem = $this->requireLockedModule($request->input('content_item_id'));

        $request->merge([
            'courseware_id' => $lockedItem->category->courseware_id,
            'term' => strtolower($lockedItem->category->name),
        ]);

        $validated = $this->validateQuiz($request);

        $quiz = DB::transaction(function () use ($validated) {
            $quiz = Quiz::create([
                'courseware_id' => $validated['courseware_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'deadline' => $validated['deadline'] ?? null,
                'term' => $validated['term'],
                'timing_mode' => $validated['timing_mode'],
                'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
                'questions_to_answer' => $validated['questions_to_answer'] ?? null,
                // Every quiz is paired to a module and is meant to be taken as
                // soon as the student finishes reading it — there's no
                // separate "publish when ready" step to go through.
                'is_published' => true,
            ]);

            $this->saveQuestions($quiz, $validated['questions']);

            return $quiz;
        });

        $lockedItem->update(['quiz_id' => $quiz->id]);

        return Redirect::route('professor.content.index', $validated['courseware_id'])
            ->with('success', "Quiz \"{$quiz->title}\" was created, published, and attached to the module.");
    }

    public function import(Request $request): Response
    {
        $lockedItem = $this->resolveLockedModule($request->query('content_item_id'));

        return Inertia::render('professor/quizzes/import', [
            'courses' => Courseware::query()
                ->where('professor_id', auth()->id())
                ->orderBy('subject')
                ->get(['id', 'subject']),
            'content_item_id' => $lockedItem?->id,
            'courseware_id' => $lockedItem?->category->courseware_id ?? $request->query('courseware_id'),
            'locked_subject' => $lockedItem?->category->courseware->subject,
            'locked_term' => $lockedItem ? strtolower($lockedItem->category->name) : null,
            'available_modules' => $this->availableModulesFor($lockedItem),
        ]);
    }

    public function storeImport(Request $request, QuizImportParser $parser): RedirectResponse
    {
        $lockedItem = $this->requireLockedModule($request->input('content_item_id'));

        $request->merge([
            'courseware_id' => $lockedItem->category->courseware_id,
            'term' => strtolower($lockedItem->category->name),
        ]);

        $validated = $request->validate([
            'courseware_id' => [
                'required',
                Rule::exists('courseware', 'id')->where('professor_id', auth()->id()),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'term' => ['required', Rule::in(TermGradingService::TERMS)],
            'file' => ['required', 'file', 'max:2048', 'mimes:txt'],
            'timing_mode' => ['required', Rule::in(self::TIMING_MODES)],
            'time_limit_minutes' => ['required_if:timing_mode,timer', 'nullable', 'integer', 'min:1', 'max:600'],
            'questions_to_answer' => ['nullable', 'integer', 'min:1'],
        ]);

        $parsed = $parser->parse($request->file('file')->get());

        if (! empty($parsed['errors'])) {
            return back()->withErrors(['file' => implode("\n", $parsed['errors'])])->withInput();
        }

        // The total question count isn't known until after the file is
        // parsed, so this can only be checked here rather than as a normal
        // validation rule.
        if (! empty($validated['questions_to_answer']) && $validated['questions_to_answer'] > count($parsed['questions'])) {
            return back()
                ->withErrors(['questions_to_answer' => "This can't be more than the number of questions in the file."])
                ->withInput();
        }

        $quiz = DB::transaction(function () use ($validated, $parsed) {
            $quiz = Quiz::create([
                'courseware_id' => $validated['courseware_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'deadline' => $validated['deadline'] ?? null,
                'term' => $validated['term'],
                'timing_mode' => $validated['timing_mode'],
                'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
                'questions_to_answer' => $validated['questions_to_answer'] ?? null,
                'is_published' => true,
            ]);

            $this->saveQuestions($quiz, $parsed['questions']);

            return $quiz;
        });

        $lockedItem->update(['quiz_id' => $quiz->id]);

        return Redirect::route('professor.content.index', $validated['courseware_id'])
            ->with('success', "Quiz \"{$quiz->title}\" was imported, published, and attached to the module.");
    }

    public function edit(Quiz $quiz): Response
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);

        // A quiz already paired to a module keeps its subject/term locked
        // here too — otherwise editing it could quietly detach it from the
        // module's own subject/term, breaking the one-module-one-quiz link.
        $linkedItem = CourseContentItem::where('quiz_id', $quiz->id)->first();

        return Inertia::render('professor/quizzes/edit', [
            'quiz' => [
                'id' => $quiz->id,
                'courseware_id' => $quiz->courseware_id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'deadline' => $quiz->deadline?->format('Y-m-d\TH:i'),
                'term' => $quiz->term,
                'timing_mode' => $quiz->timing_mode,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'questions_to_answer' => $quiz->questions_to_answer,
                'is_published' => $quiz->is_published,
                'has_attempts' => $quiz->attempts()->exists(),
                'questions' => $quiz->questions->load('options')->map(fn ($question) => [
                    'question' => $question->question,
                    'options' => $question->options->map(fn ($option) => [
                        'option_text' => $option->option_text,
                        'is_correct' => $option->is_correct,
                    ]),
                ]),
            ],
            'courses' => Courseware::query()
                ->where('professor_id', auth()->id())
                ->orderBy('subject')
                ->get(['id', 'subject']),
            'content_item_id' => $linkedItem?->id,
        ]);
    }

    public function update(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);

        $linkedItem = CourseContentItem::with('category')->where('quiz_id', $quiz->id)->first();

        if ($linkedItem) {
            $request->merge([
                'courseware_id' => $linkedItem->category->courseware_id,
                'term' => strtolower($linkedItem->category->name),
            ]);
        }

        $hasAttempts = $quiz->attempts()->exists();

        if ($hasAttempts) {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'deadline' => ['nullable', 'date'],
                'term' => ['required', Rule::in(TermGradingService::TERMS)],
                'courseware_id' => [
                    'required',
                    Rule::exists('courseware', 'id')->where('professor_id', auth()->id()),
                ],
                'timing_mode' => ['required', Rule::in(self::TIMING_MODES)],
                'time_limit_minutes' => ['required_if:timing_mode,timer', 'nullable', 'integer', 'min:1', 'max:600'],
                // The question bank itself is locked once there are
                // attempts, but this can still change — it only affects
                // attempts made from here on, and each existing attempt
                // already has its own subset snapshotted.
                'questions_to_answer' => ['nullable', 'integer', 'min:1', 'max:'.$quiz->questions()->count()],
            ]);

            $validated['time_limit_minutes'] = $validated['time_limit_minutes'] ?? null;
            $validated['questions_to_answer'] = $validated['questions_to_answer'] ?? null;

            $quiz->update($validated);

            return Redirect::route('professor.quizzes.index')
                ->with('success', "Quiz \"{$quiz->title}\" was updated successfully.");
        }

        $validated = $this->validateQuiz($request);

        DB::transaction(function () use ($quiz, $validated): void {
            $quiz->update([
                'courseware_id' => $validated['courseware_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'deadline' => $validated['deadline'] ?? null,
                'term' => $validated['term'],
                'timing_mode' => $validated['timing_mode'],
                'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
                'questions_to_answer' => $validated['questions_to_answer'] ?? null,
            ]);

            $quiz->questions()->delete();

            $this->saveQuestions($quiz, $validated['questions']);
        });

        return Redirect::route('professor.quizzes.index')
            ->with('success', "Quiz \"{$quiz->title}\" was updated successfully.");
    }

    public function togglePublish(Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);

        $quiz->is_published = ! $quiz->is_published;
        $quiz->save();

        $status = $quiz->is_published ? 'published' : 'unpublished';

        return back()->with('success', "Quiz \"{$quiz->title}\" was {$status}.");
    }

    public function destroy(Quiz $quiz): RedirectResponse
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);

        $quiz->delete();

        return back()->with('success', "Quiz \"{$quiz->title}\" was deleted.");
    }

    /**
     * Grants a student permission tied to this quiz's deadline — for a
     * student who hasn't attempted yet, that just lets them start past the
     * deadline. For a student who already submitted, there's only one real
     * way to act on that permission: clear their finished attempt so the
     * next visit gives them a genuine second attempt, since a quiz never
     * allows more than one by default.
     */
    public function grantLateException(Quiz $quiz, User $student): RedirectResponse
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);
        abort_unless(
            Enrollment::where('courseware_id', $quiz->courseware_id)->where('student_id', $student->id)->exists(),
            404,
        );

        LateException::firstOrCreate(
            [
                'exceptionable_type' => Quiz::class,
                'exceptionable_id' => $quiz->id,
                'student_id' => $student->id,
            ],
            ['granted_by' => auth()->id()],
        );

        $finishedAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('student_id', $student->id)
            ->whereNotNull('submitted_at')
            ->first();

        if ($finishedAttempt) {
            $finishedAttempt->responses()->delete();
            $finishedAttempt->delete();

            return back()->with('success', "{$student->name} can now retake this quiz.");
        }

        return back()->with('success', "Late exception granted to {$student->name}.");
    }

    public function revokeLateException(Quiz $quiz, User $student): RedirectResponse
    {
        abort_unless($quiz->courseware->professor_id === auth()->id(), 403);

        LateException::where([
            'exceptionable_type' => Quiz::class,
            'exceptionable_id' => $quiz->id,
            'student_id' => $student->id,
        ])->delete();

        return back()->with('success', "Late exception revoked for {$student->name}.");
    }

    private function validateQuiz(Request $request): array
    {
        $validator = ValidatorFacade::make($request->all(), [
            'courseware_id' => [
                'required',
                Rule::exists('courseware', 'id')->where('professor_id', auth()->id()),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'term' => ['required', Rule::in(TermGradingService::TERMS)],
            'timing_mode' => ['required', Rule::in(self::TIMING_MODES)],
            'time_limit_minutes' => ['required_if:timing_mode,timer', 'nullable', 'integer', 'min:1', 'max:600'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question' => ['required', 'string'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.option_text' => ['required', 'string', 'max:255'],
            'questions.*.options.*.is_correct' => ['boolean'],
            'questions_to_answer' => ['nullable', 'integer', 'min:1'],
        ]);

        $validator->after(function (Validator $validator) use ($request): void {
            $questions = $request->input('questions', []);

            foreach ($questions as $index => $question) {
                $correctCount = collect($question['options'] ?? [])
                    ->filter(fn ($option) => ! empty($option['is_correct']))
                    ->count();

                if ($correctCount !== 1) {
                    $validator->errors()->add(
                        "questions.{$index}.options",
                        'Each question must have exactly one correct answer.',
                    );
                }
            }

            $questionsToAnswer = $request->input('questions_to_answer');

            if ($questionsToAnswer !== null && $questionsToAnswer !== '' && (int) $questionsToAnswer > count($questions)) {
                $validator->errors()->add(
                    'questions_to_answer',
                    "This can't be more than the number of questions in the quiz.",
                );
            }
        });

        return $validator->validate();
    }

    /**
     * Modules that don't have a quiz yet, for the quiz create/import pages'
     * required "Module" dropdown — a quiz can't be created without picking
     * one of these. Not needed (and left empty) when the page was reached
     * via a module's own "Add Quiz" button, since the module is already
     * fixed in that case.
     *
     * @return Collection<int, array{id: int, title: string, subject: string, term: lowercase-string, courseware_id: int}>
     */
    private function availableModulesFor(?CourseContentItem $lockedItem): Collection
    {
        if ($lockedItem) {
            return collect();
        }

        return CourseContentItem::query()
            ->whereNull('quiz_id')
            ->whereHas('category.courseware', function ($query): void {
                $query->where('professor_id', auth()->id());
            })
            ->with('category.courseware')
            ->get()
            ->map(fn (CourseContentItem $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'subject' => (string) $item->category->courseware->subject,
                'term' => (string) strtolower($item->category->name),
                'courseware_id' => (int) $item->category->courseware_id,
            ])
            ->sortBy(fn (array $module) => $module['subject'].$module['term'])
            ->values();
    }

    /**
     * When a quiz is created from a module's own "Add Quiz"/"Import Quiz"
     * button, the request carries a content_item_id to attach it to
     * afterward. The module's own subject and term (its content category is
     * always named Prelims/Midterm/Finals) are treated as the source of
     * truth — the subject and term fields are locked out of the quiz form
     * entirely rather than left editable, so this always overrides whatever
     * the client sent for courseware_id/term. Returns null if no
     * content_item_id was sent (the normal quizzes-index flow).
     */
    private function resolveLockedModule(?string $contentItemId): ?CourseContentItem
    {
        if (empty($contentItemId)) {
            return null;
        }

        $item = CourseContentItem::with('category.courseware')->find($contentItemId);

        abort_unless(
            $item && $item->category->courseware->professor_id === auth()->id(),
            403,
        );

        // A module only ever pairs with one quiz — re-attaching a new one
        // here would silently orphan whichever quiz it already has.
        // Replacing a module's quiz is done through that quiz's own Edit
        // page, not by creating another one.
        abort_if($item->quiz_id !== null, 409, 'This module already has a quiz.');

        return $item;
    }

    /**
     * A quiz can't be created on its own — every quiz must be attached to a
     * module, so this is used at the two POST endpoints where
     * resolveLockedModule() being null would otherwise mean "standalone."
     */
    private function requireLockedModule(?string $contentItemId): CourseContentItem
    {
        $item = $this->resolveLockedModule($contentItemId);

        abort_if($item === null, 422, "A quiz can't be created on its own — select the module it belongs to.");

        return $item;
    }

    private function saveQuestions(Quiz $quiz, array $questions): void
    {
        foreach ($questions as $index => $question) {
            $quizQuestion = $quiz->questions()->create([
                'question' => $question['question'],
                'order' => $index,
            ]);

            foreach ($question['options'] as $optionIndex => $option) {
                $quizQuestion->options()->create([
                    'option_text' => $option['option_text'],
                    'is_correct' => ! empty($option['is_correct']),
                    'order' => $optionIndex,
                ]);
            }
        }
    }
}
