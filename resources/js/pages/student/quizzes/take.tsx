import { Head, router, usePage } from '@inertiajs/react';
import { ClipboardList, Clock, Send } from 'lucide-react';
import type { ClipboardEvent, FormEvent, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

interface Quiz {
    id: number;
    title: string;
    description: string | null;
}

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question: string;
    options: Option[];
}

interface Timing {
    mode: 'timestamp' | 'timer';
    started_at: string;
    expires_at: string | null;
}

interface TakeQuizProps {
    quiz: Quiz;
    questions: Question[];
    timing: Timing;
}

function formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface AuthUser {
    name: string;
    email: string;
}

interface PageProps {
    auth: { user: AuthUser };
    [key: string]: unknown;
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildWatermarkBackground(text: string): string {
    const label = escapeXml(text);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="170">
        <text x="10" y="90" transform="rotate(-30 170 85)" font-size="13" fill="rgba(100,116,139,0.28)" font-family="sans-serif">${label}</text>
    </svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function ScreenshotWatermark({ text }: { text: string }) {
    const backgroundImage = useMemo(
        () => buildWatermarkBackground(text),
        [text],
    );

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 select-none"
            style={{ backgroundImage, backgroundRepeat: 'repeat' }}
        />
    );
}

export default function TakeQuiz({ quiz, questions, timing }: TakeQuizProps) {
    const {
        auth: { user },
    } = usePage<PageProps>().props;
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const autoSubmittedRef = useRef(false);
    const answersRef = useRef(answers);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const expiresAt = useMemo(
        () => (timing.expires_at ? new Date(timing.expires_at) : null),
        [timing.expires_at],
    );

    const [remainingSeconds, setRemainingSeconds] = useState(() =>
        expiresAt
            ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
            : null,
    );

    const blockCopy = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const blockContextMenu = (event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const submitAnswers = () => {
        setProcessing(true);

        router.post(
            `/student/quizzes/${quiz.id}`,
            { answers: answersRef.current },
            {
                onError: (formErrors) => {
                    setErrors(formErrors as Record<string, string>);
                    setProcessing(false);
                },
                onSuccess: () => setProcessing(false),
            },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitAnswers();
    };

    useEffect(() => {
        if (!expiresAt) {
            return;
        }

        const tick = () => {
            const secondsLeft = Math.max(
                0,
                Math.floor((expiresAt.getTime() - Date.now()) / 1000),
            );

            setRemainingSeconds(secondsLeft);

            if (secondsLeft === 0 && !autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                submitAnswers();
            }
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresAt]);

    return (
        <>
            <Head title={quiz.title} />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <div
                        onCopy={blockCopy}
                        onCut={blockCopy}
                        onContextMenu={blockContextMenu}
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm select-none"
                    >
                        <ScreenshotWatermark
                            text={`${user.name} · ${user.email}`}
                        />

                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <ClipboardList className="size-7" />
                                    <div>
                                        <h1 className="text-2xl font-bold">
                                            {quiz.title}
                                        </h1>
                                        {quiz.description && (
                                            <p className="mt-1 text-sm text-red-100">
                                                {quiz.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {timing.mode === 'timer' &&
                                    remainingSeconds !== null && (
                                        <div
                                            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                                                remainingSeconds <= 60
                                                    ? 'animate-pulse bg-white text-red-700'
                                                    : 'bg-white/15 text-white'
                                            }`}
                                        >
                                            <Clock className="size-4" />
                                            {formatDuration(remainingSeconds)}
                                        </div>
                                    )}
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6">
                            <div className="grid gap-6">
                                {questions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="rounded-xl border border-slate-200 p-4"
                                    >
                                        <p className="font-medium text-slate-900">
                                            {index + 1}. {question.question}
                                        </p>
                                        <div className="mt-3 grid gap-2">
                                            {question.options.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className="flex items-center gap-2 text-sm text-slate-700"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        checked={
                                                            answers[
                                                                question.id
                                                            ] === option.id
                                                        }
                                                        onChange={() =>
                                                            setAnswers(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [question.id]:
                                                                        option.id,
                                                                }),
                                                            )
                                                        }
                                                        required
                                                    />
                                                    {option.option_text}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={
                                                errors[`answers.${question.id}`]
                                            }
                                        />
                                    </div>
                                ))}

                                <div className="flex justify-end border-t border-slate-200 pt-5">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <Send className="size-4" />
                                        {processing
                                            ? 'Submitting...'
                                            : 'Submit Quiz'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
