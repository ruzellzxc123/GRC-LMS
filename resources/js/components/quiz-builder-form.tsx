import { router } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Course {
    id: number;
    subject: string;
}

interface ModuleOption {
    id: number;
    title: string;
    subject: string;
    term: string;
    courseware_id: number;
}

const TERM_LABELS: Record<string, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

export interface OptionState {
    option_text: string;
    is_correct: boolean;
    [key: string]: string | boolean;
}

export interface QuestionState {
    question: string;
    options: OptionState[];
    [key: string]: string | OptionState[];
}

interface QuizBuilderFormProps {
    courses: Course[];
    submitUrl: string;
    submitMethod: 'post' | 'put';
    submitLabel: string;
    initialTitle?: string;
    initialDescription?: string;
    initialDeadline?: string;
    initialTerm?: string;
    initialCoursewareId?: number | null;
    initialQuestions?: QuestionState[];
    initialTimingMode?: 'timestamp' | 'timer';
    initialTimeLimitMinutes?: number | null;
    initialQuestionsToAnswer?: number | null;
    lockQuestions?: boolean;
    /** Set when this quiz is being created from a module's own "Add Quiz"
     * button — it gets attached to that module once saved, and the module
     * can't be changed from here. */
    contentItemId?: number | null;
    /** Modules without a quiz yet — a new quiz must be attached to one of
     * these (a quiz can never be created standalone), letting a professor
     * who forgot to add a quiz while uploading a module attach one here
     * instead of going back to edit it. */
    availableModules?: ModuleOption[];
}

const emptyOption = (): OptionState => ({ option_text: '', is_correct: false });
const emptyQuestion = (): QuestionState => ({
    question: '',
    options: [emptyOption(), emptyOption()],
});

export default function QuizBuilderForm({
    courses,
    submitUrl,
    submitMethod,
    submitLabel,
    initialTitle = '',
    initialDescription = '',
    initialDeadline = '',
    initialTerm = 'prelims',
    initialCoursewareId = null,
    initialQuestions,
    initialTimingMode = 'timestamp',
    initialTimeLimitMinutes = null,
    initialQuestionsToAnswer = null,
    lockQuestions = false,
    contentItemId = null,
    availableModules = [],
}: QuizBuilderFormProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [deadline, setDeadline] = useState(initialDeadline);
    const [term, setTerm] = useState(initialTerm);
    const [coursewareId, setCoursewareId] = useState(initialCoursewareId ?? '');
    const [timingMode, setTimingMode] = useState(initialTimingMode);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(
        initialTimeLimitMinutes ? String(initialTimeLimitMinutes) : '',
    );
    const [questions, setQuestions] = useState<QuestionState[]>(
        initialQuestions && initialQuestions.length > 0
            ? initialQuestions
            : [emptyQuestion()],
    );
    const [questionsToAnswer, setQuestionsToAnswer] = useState(
        initialQuestionsToAnswer ? String(initialQuestionsToAnswer) : '',
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Question banking: leaving this blank means every question is
    // required, same as before this existed. Setting it lower than the
    // bank size means each student is randomly given a different, shuffled
    // subset of that many questions when they take the quiz — answers can't
    // just be copied from someone else's screen since they may not even
    // have the same questions.
    const updateQuestionsToAnswer = (rawValue: string) => {
        const numValue = Number(rawValue);
        const value =
            rawValue === '' || Number.isNaN(numValue)
                ? rawValue
                : String(Math.min(Math.max(1, numValue), questions.length));

        setQuestionsToAnswer(value);
    };

    // A quiz can never exist on its own — it must always belong to a module.
    // Creating from a module's own "Add Quiz"/"Import Quiz" button means the
    // subject and term are already fixed by that module, so those fields are
    // locked instead of shown. On the standalone create/import pages (no
    // fixed contentItemId), a professor must instead pick one of their
    // quiz-less modules below, which locks the same way once chosen. This
    // requirement only applies to creating a new quiz (submitMethod "post")
    // — editing an existing one ("put") never re-attaches it.
    const isCreating = submitMethod === 'post';
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
        null,
    );
    const effectiveContentItemId = contentItemId ?? selectedModuleId;
    const isLockedToModule = effectiveContentItemId !== null;
    const lockedSubjectName = courses.find(
        (course) => course.id === coursewareId,
    )?.subject;

    const selectModule = (value: string) => {
        const moduleId = value ? Number(value) : null;
        setSelectedModuleId(moduleId);

        const selected = availableModules.find(
            (module) => module.id === moduleId,
        );

        if (selected) {
            setCoursewareId(selected.courseware_id);
            setTerm(selected.term);
        }
    };

    // The module list only ever offers modules under whichever subject is
    // picked above — a professor chooses the subject first, then sees just
    // that subject's quiz-less modules, instead of every subject's mixed
    // together.
    const modulesForSubject =
        coursewareId === ''
            ? []
            : availableModules.filter(
                  (module) =>
                      String(module.courseware_id) === String(coursewareId),
              );

    const selectSubject = (value: string) => {
        setCoursewareId(value ? Number(value) : '');
        // A module belongs to one subject — switching subjects invalidates
        // whatever was picked before.
        setSelectedModuleId(null);
    };

    const addQuestion = () =>
        setQuestions((prev) => [...prev, emptyQuestion()]);

    const removeQuestion = (index: number) =>
        setQuestions((prev) => prev.filter((_, i) => i !== index));

    const updateQuestionText = (index: number, value: string) =>
        setQuestions((prev) =>
            prev.map((q, i) => (i === index ? { ...q, question: value } : q)),
        );

    const addOption = (questionIndex: number) =>
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === questionIndex
                    ? { ...q, options: [...q.options, emptyOption()] }
                    : q,
            ),
        );

    const removeOption = (questionIndex: number, optionIndex: number) =>
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === questionIndex
                    ? {
                          ...q,
                          options: q.options.filter(
                              (_, oi) => oi !== optionIndex,
                          ),
                      }
                    : q,
            ),
        );

    const updateOptionText = (
        questionIndex: number,
        optionIndex: number,
        value: string,
    ) =>
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === questionIndex
                    ? {
                          ...q,
                          options: q.options.map((o, oi) =>
                              oi === optionIndex
                                  ? { ...o, option_text: value }
                                  : o,
                          ),
                      }
                    : q,
            ),
        );

    const setCorrectOption = (questionIndex: number, optionIndex: number) =>
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === questionIndex
                    ? {
                          ...q,
                          options: q.options.map((o, oi) => ({
                              ...o,
                              is_correct: oi === optionIndex,
                          })),
                      }
                    : q,
            ),
        );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);

        const timingFields = {
            timing_mode: timingMode,
            time_limit_minutes:
                timingMode === 'timer' && timeLimitMinutes !== ''
                    ? Number(timeLimitMinutes)
                    : null,
        };

        const questionsToAnswerField = {
            questions_to_answer:
                questionsToAnswer === '' ? null : Number(questionsToAnswer),
        };

        const payload = lockQuestions
            ? {
                  title,
                  description,
                  deadline,
                  term,
                  courseware_id: coursewareId,
                  content_item_id: effectiveContentItemId,
                  ...timingFields,
                  ...questionsToAnswerField,
              }
            : {
                  title,
                  description,
                  deadline,
                  term,
                  courseware_id: coursewareId,
                  questions,
                  content_item_id: effectiveContentItemId,
                  ...timingFields,
                  ...questionsToAnswerField,
              };

        const options = {
            onError: (formErrors: Record<string, string>) => {
                setErrors(formErrors);
                setProcessing(false);
            },
            onSuccess: () => setProcessing(false),
        };

        if (submitMethod === 'post') {
            router.post(submitUrl, payload, options);
        } else {
            router.put(submitUrl, payload, options);
        }
    };

    return (
        <form onSubmit={submit} className="p-6">
            <div className="grid gap-6">
                {isLockedToModule ? (
                    <div className="grid gap-2">
                        <Label>Subject</Label>
                        <p className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                            {lockedSubjectName ?? "This module's subject"}
                        </p>
                        <p className="text-xs text-slate-500">
                            Locked to the subject of the module this quiz is
                            being added to.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="courseware_id">Subject</Label>
                        <select
                            id="courseware_id"
                            value={coursewareId}
                            onChange={(event) =>
                                selectSubject(event.target.value)
                            }
                            required
                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                        >
                            <option value="">Select subject</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.subject}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.courseware_id} />
                    </div>
                )}

                {isCreating &&
                    contentItemId === null &&
                    coursewareId !== '' &&
                    (modulesForSubject.length > 0 ? (
                        <div className="grid gap-2">
                            <Label htmlFor="attach_module">Module</Label>
                            <select
                                id="attach_module"
                                value={selectedModuleId ?? ''}
                                onChange={(event) =>
                                    selectModule(event.target.value)
                                }
                                required
                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                            >
                                <option value="">Select a module</option>
                                {modulesForSubject.map((module) => (
                                    <option key={module.id} value={module.id}>
                                        {TERM_LABELS[module.term] ??
                                            module.term}{' '}
                                        — {module.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">
                                A quiz can't be created on its own — pick which
                                module it belongs to. Only modules from this
                                subject with no quiz yet are listed, so you
                                can't double-assign one. The term below fills in
                                automatically.
                            </p>
                            <InputError message={errors.content_item_id} />
                        </div>
                    ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            This subject has no modules without a quiz yet —
                            upload a module under Subject Content first, then
                            come back here to add its quiz.
                        </p>
                    ))}

                <div className="grid gap-2">
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                        placeholder="Enter quiz title"
                    />
                    <InputError message={errors.title} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={3}
                        placeholder="Optional description"
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                        id="deadline"
                        type="datetime-local"
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                    />
                    <InputError message={errors.deadline} />
                </div>

                {isLockedToModule ? (
                    <div className="grid gap-2">
                        <Label>Term</Label>
                        <p className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 capitalize">
                            {term}
                        </p>
                        <p className="text-xs text-slate-500">
                            Locked to the term this module was posted under.
                        </p>
                    </div>
                ) : isCreating ? (
                    <div className="grid gap-2">
                        <Label>Term</Label>
                        <p className="flex h-10 items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-400">
                            Select a module above to set the term
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="term">Term</Label>
                        <select
                            id="term"
                            value={term}
                            onChange={(event) => setTerm(event.target.value)}
                            required
                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                        >
                            <option value="prelims">Prelims</option>
                            <option value="midterm">Midterm</option>
                            <option value="finals">Finals</option>
                        </select>
                        <InputError message={errors.term} />
                    </div>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="timing_mode">Timing</Label>
                    <select
                        id="timing_mode"
                        value={timingMode}
                        onChange={(event) =>
                            setTimingMode(
                                event.target.value as 'timestamp' | 'timer',
                            )
                        }
                        required
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                    >
                        <option value="timestamp">
                            Timestamp — just record how long each student takes
                        </option>
                        <option value="timer">
                            Timer — give students a time limit once they start
                        </option>
                    </select>
                    <InputError message={errors.timing_mode} />
                </div>

                {timingMode === 'timer' && (
                    <div className="grid gap-2">
                        <Label htmlFor="time_limit_minutes">
                            Time Limit (minutes)
                        </Label>
                        <Input
                            id="time_limit_minutes"
                            type="number"
                            min={1}
                            max={600}
                            value={timeLimitMinutes}
                            onChange={(event) =>
                                setTimeLimitMinutes(event.target.value)
                            }
                            required
                            placeholder="e.g. 30"
                        />
                        <p className="text-xs text-slate-500">
                            Once a student opens this quiz, they must finish
                            within this many minutes — it auto-submits whatever
                            they've answered when time runs out.
                        </p>
                        <InputError message={errors.time_limit_minutes} />
                    </div>
                )}

                <div className="grid gap-2 border-t border-slate-200 pt-6">
                    <Label htmlFor="questions_to_answer">
                        Questions to Answer (optional)
                    </Label>
                    <Input
                        id="questions_to_answer"
                        type="number"
                        min={1}
                        max={questions.length}
                        value={questionsToAnswer}
                        onChange={(event) =>
                            updateQuestionsToAnswer(event.target.value)
                        }
                        placeholder={`All ${questions.length} question${questions.length === 1 ? '' : 's'}`}
                    />
                    <p className="text-xs text-slate-500">
                        Leave blank to require every question. Set a smaller
                        number and each student will be randomly given a
                        different, shuffled subset of that many questions when
                        they take the quiz — this helps prevent students from
                        comparing answers with each other.
                    </p>
                    <InputError message={errors.questions_to_answer} />
                </div>

                {lockQuestions ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Students have already attempted this quiz, so questions
                        and answers can no longer be edited.
                    </p>
                ) : (
                    <div className="grid gap-4 border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                Questions
                            </h2>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Plus className="size-4" />
                                Add Question
                            </button>
                        </div>

                        {questions.map((question, questionIndex) => (
                            <div
                                key={questionIndex}
                                className="rounded-xl border border-slate-200 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="grid w-full gap-2">
                                        <Label>
                                            Question {questionIndex + 1}
                                        </Label>
                                        <Textarea
                                            value={question.question}
                                            onChange={(event) =>
                                                updateQuestionText(
                                                    questionIndex,
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            rows={2}
                                            placeholder="Enter the question"
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `questions.${questionIndex}.question`
                                                ]
                                            }
                                        />
                                    </div>

                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeQuestion(questionIndex)
                                            }
                                            className="mt-6 shrink-0 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 grid gap-2">
                                    <Label>
                                        Options (select the correct answer)
                                    </Label>
                                    {question.options.map(
                                        (option, optionIndex) => (
                                            <div
                                                key={optionIndex}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`correct-${questionIndex}`}
                                                    checked={option.is_correct}
                                                    onChange={() =>
                                                        setCorrectOption(
                                                            questionIndex,
                                                            optionIndex,
                                                        )
                                                    }
                                                />
                                                <Input
                                                    value={option.option_text}
                                                    onChange={(event) =>
                                                        updateOptionText(
                                                            questionIndex,
                                                            optionIndex,
                                                            event.target.value,
                                                        )
                                                    }
                                                    required
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                />
                                                {question.options.length >
                                                    2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeOption(
                                                                questionIndex,
                                                                optionIndex,
                                                            )
                                                        }
                                                        className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ),
                                    )}
                                    <InputError
                                        message={
                                            errors[
                                                `questions.${questionIndex}.options`
                                            ]
                                        }
                                    />

                                    {question.options.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                addOption(questionIndex)
                                            }
                                            className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <Plus className="size-4" />
                                            Add Option
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <Button
                        type="submit"
                        disabled={
                            processing ||
                            (isCreating && effectiveContentItemId === null)
                        }
                        className="gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                        <Save className="size-4" />
                        {processing ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
