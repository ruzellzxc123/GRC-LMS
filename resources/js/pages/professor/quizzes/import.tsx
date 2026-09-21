import { Head, router, usePage } from '@inertiajs/react';
import { HelpCircle, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import BackLink from '@/components/back-link';
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

interface ImportQuizProps {
    courses: Course[];
    content_item_id?: string | null;
    courseware_id?: string | null;
    locked_term?: string | null;
    available_modules?: ModuleOption[];
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

const TERM_LABELS: Record<string, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

const TEMPLATE_EXAMPLE = `Q: What is the capital of the Philippines?
A) Cebu City
B) Manila *
C) Davao City
D) Baguio City

Q: Which of these is a prime number?
A) 4
B) 6
C) 7 *
D) 9`;

export default function ImportQuiz({
    courses,
    content_item_id,
    courseware_id,
    locked_term,
    available_modules,
}: ImportQuizProps) {
    const { errors } = usePage<PageProps>().props;
    const contentItemId = content_item_id ? Number(content_item_id) : null;
    const availableModules = available_modules ?? [];
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
        null,
    );
    const effectiveContentItemId = contentItemId ?? selectedModuleId;
    const isLockedToModule = effectiveContentItemId !== null;
    const [coursewareId, setCoursewareId] = useState(courseware_id ?? '');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [term, setTerm] = useState(locked_term ?? 'prelims');
    const lockedSubjectName = courses.find(
        (course) => String(course.id) === coursewareId,
    )?.subject;

    const selectModule = (value: string) => {
        const moduleId = value ? Number(value) : null;
        setSelectedModuleId(moduleId);

        const selected = availableModules.find(
            (module) => module.id === moduleId,
        );

        if (selected) {
            setCoursewareId(String(selected.courseware_id));
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
                  (module) => String(module.courseware_id) === coursewareId,
              );

    const selectSubject = (value: string) => {
        setCoursewareId(value);
        // A module belongs to one subject — switching subjects invalidates
        // whatever was picked before.
        setSelectedModuleId(null);
    };

    const [questionsToAnswer, setQuestionsToAnswer] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [timingMode, setTimingMode] = useState<'timestamp' | 'timer'>(
        'timestamp',
    );
    const [timeLimitMinutes, setTimeLimitMinutes] = useState('');

    const fileErrors = errors.file
        ? String(errors.file).split('\n').filter(Boolean)
        : [];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);

        router.post(
            '/professor/quizzes/import',
            {
                courseware_id: coursewareId,
                title,
                description,
                deadline,
                term,
                file,
                timing_mode: timingMode,
                time_limit_minutes:
                    timingMode === 'timer' && timeLimitMinutes !== ''
                        ? Number(timeLimitMinutes)
                        : null,
                content_item_id: effectiveContentItemId,
                questions_to_answer:
                    questionsToAnswer === '' ? null : Number(questionsToAnswer),
            },
            {
                forceFormData: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Import Quiz" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href="/professor/quizzes">
                        Back to quizzes
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <UploadCloud className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Import Quiz
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        {isLockedToModule
                                            ? "Upload a text file to build this module's quiz — no shared document to copy from."
                                            : "Upload a text file and we'll turn it into an interactive quiz students answer inside the LMS — no shared document to copy from."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-200 bg-amber-50">
                            <button
                                type="button"
                                onClick={() => setShowGuide((value) => !value)}
                                className="flex w-full items-center gap-2 px-6 py-3 text-left text-sm font-semibold text-amber-800"
                            >
                                <HelpCircle className="size-4" />
                                How to format your file
                                <span className="ml-auto text-xs font-normal text-amber-700">
                                    {showGuide ? 'Hide' : 'Show'}
                                </span>
                            </button>

                            {showGuide && (
                                <div className="space-y-3 px-6 pb-5 text-sm text-amber-900">
                                    <p>
                                        Save a plain <code>.txt</code> file with
                                        one block per question:
                                    </p>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>
                                            Start each question with{' '}
                                            <code>Q:</code>
                                        </li>
                                        <li>
                                            List each option on its own line,
                                            starting with a letter like{' '}
                                            <code>A)</code>, <code>B)</code>,
                                            etc.
                                        </li>
                                        <li>
                                            Mark the correct option by adding{' '}
                                            <code>*</code> at the end of that
                                            line
                                        </li>
                                        <li>
                                            Each question needs at least 2
                                            options, with exactly one marked
                                            correct
                                        </li>
                                        <li>
                                            Leave a blank line between questions
                                        </li>
                                    </ul>
                                    <pre className="overflow-x-auto rounded-lg border border-amber-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-700">
                                        {TEMPLATE_EXAMPLE}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <form onSubmit={submit} className="grid gap-6 p-6">
                            {isLockedToModule ? (
                                <div className="grid gap-2">
                                    <Label>Subject</Label>
                                    <p className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                                        {lockedSubjectName ??
                                            "This module's subject"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Locked to the subject of the module this
                                        quiz is being added to.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="courseware_id">
                                        Subject
                                    </Label>
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
                                            <option
                                                key={course.id}
                                                value={course.id}
                                            >
                                                {course.subject}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.courseware_id}
                                    />
                                </div>
                            )}

                            {contentItemId === null &&
                                coursewareId !== '' &&
                                (modulesForSubject.length > 0 ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="attach_module">
                                            Module
                                        </Label>
                                        <select
                                            id="attach_module"
                                            value={selectedModuleId ?? ''}
                                            onChange={(event) =>
                                                selectModule(event.target.value)
                                            }
                                            required
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
                                                Select a module
                                            </option>
                                            {modulesForSubject.map((module) => (
                                                <option
                                                    key={module.id}
                                                    value={module.id}
                                                >
                                                    {TERM_LABELS[module.term] ??
                                                        module.term}{' '}
                                                    — {module.title}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500">
                                            A quiz can't be created on its own —
                                            pick which module it belongs to.
                                            Only modules from this subject with
                                            no quiz yet are listed, so you can't
                                            double-assign one. The term below
                                            fills in automatically.
                                        </p>
                                        <InputError
                                            message={errors.content_item_id}
                                        />
                                    </div>
                                ) : (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        This subject has no modules without a
                                        quiz yet — upload a module under Subject
                                        Content first, then come back here to
                                        add its quiz.
                                    </p>
                                ))}

                            <div className="grid gap-2">
                                <Label htmlFor="title">Quiz Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
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
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
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
                                    onChange={(event) =>
                                        setDeadline(event.target.value)
                                    }
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
                                        Locked to the term this module was
                                        posted under.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label>Term</Label>
                                    <p className="flex h-10 items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-400">
                                        Select a module above to set the term
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="timing_mode">Timing</Label>
                                <select
                                    id="timing_mode"
                                    value={timingMode}
                                    onChange={(event) =>
                                        setTimingMode(
                                            event.target.value as
                                                'timestamp' | 'timer',
                                        )
                                    }
                                    required
                                    className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                >
                                    <option value="timestamp">
                                        Timestamp — just record how long each
                                        student takes
                                    </option>
                                    <option value="timer">
                                        Timer — give students a time limit once
                                        they start
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
                                            setTimeLimitMinutes(
                                                event.target.value,
                                            )
                                        }
                                        required
                                        placeholder="e.g. 30"
                                    />
                                    <InputError
                                        message={errors.time_limit_minutes}
                                    />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="questions_to_answer">
                                    Questions to Answer (optional)
                                </Label>
                                <Input
                                    id="questions_to_answer"
                                    type="number"
                                    min={1}
                                    value={questionsToAnswer}
                                    onChange={(event) =>
                                        setQuestionsToAnswer(event.target.value)
                                    }
                                    placeholder="All questions in the file"
                                />
                                <p className="text-xs text-slate-500">
                                    Leave blank to require every question in the
                                    file. Set a smaller number and each student
                                    will be randomly given a different, shuffled
                                    subset of that many questions — this helps
                                    prevent students from comparing answers with
                                    each other.
                                </p>
                                <InputError
                                    message={errors.questions_to_answer}
                                />
                            </div>

                            <div className="grid gap-2 border-t border-slate-200 pt-6">
                                <Label htmlFor="file">Quiz File (.txt)</Label>
                                <input
                                    id="file"
                                    type="file"
                                    accept=".txt,text/plain"
                                    onChange={(event) =>
                                        setFile(event.target.files?.[0] ?? null)
                                    }
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                                />
                                {fileErrors.length > 0 && (
                                    <ul className="list-disc space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 pl-8 text-xs text-red-700">
                                        {fileErrors.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        effectiveContentItemId === null
                                    }
                                >
                                    {processing
                                        ? 'Importing...'
                                        : 'Import Quiz'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
