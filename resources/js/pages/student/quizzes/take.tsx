import { Head, router } from '@inertiajs/react';
import { ClipboardList, Clock, EyeOff, Send, ShieldAlert } from 'lucide-react';
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

type BlackoutReason = 'screenshot' | 'left-tab' | null;

/**
 * There is no web API that can detect or intercept an OS-level screenshot
 * (Snipping Tool, Win+Shift+S, mobile capture, or a second device's camera)
 * — a page can't see or stop those. What this *can* do, and does:
 *   - Catch the literal PrintScreen key and black out immediately (a
 *     deterrent + logged flag, not a guaranteed block — the OS has likely
 *     already copied the frame to the clipboard before JS runs).
 *   - Black out whenever the tab/window loses focus (alt-tabbing to look
 *     something up, or many external screenshot tools briefly stealing
 *     focus) and require the student to deliberately resume.
 * Every trigger increments a counter submitted with the attempt, so the
 * professor sees how many times it happened even though the page can't stop
 * every method of capturing the screen.
 */
function useScreenshotDeterrent() {
    const [blackout, setBlackout] = useState<BlackoutReason>(null);
    const suspiciousCountRef = useRef(0);
    const wasHiddenRef = useRef(false);

    useEffect(() => {
        const trigger = (reason: BlackoutReason) => {
            suspiciousCountRef.current += 1;
            setBlackout(reason);
        };

        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'PrintScreen') {
                trigger('screenshot');
            }
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                wasHiddenRef.current = true;

                return;
            }

            if (wasHiddenRef.current) {
                wasHiddenRef.current = false;
                trigger('left-tab');
            }
        };

        window.addEventListener('keyup', onKeyUp);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('keyup', onKeyUp);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
    }, []);

    return {
        blackout,
        resume: () => setBlackout(null),
        suspiciousCountRef,
    };
}

function BlackoutOverlay({
    reason,
    onResume,
}: {
    reason: 'screenshot' | 'left-tab';
    onResume: () => void;
}) {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black p-6 text-center">
            {reason === 'screenshot' ? (
                <ShieldAlert className="size-10 text-red-500" />
            ) : (
                <EyeOff className="size-10 text-red-500" />
            )}
            <div>
                <p className="font-semibold text-white">
                    {reason === 'screenshot'
                        ? 'Screenshot key detected'
                        : 'You left the quiz tab'}
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-300">
                    This has been logged for your professor. Click below to
                    continue your attempt.
                </p>
            </div>
            <button
                type="button"
                onClick={onResume}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
                Resume Quiz
            </button>
        </div>
    );
}

export default function TakeQuiz({ quiz, questions, timing }: TakeQuizProps) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const autoSubmittedRef = useRef(false);
    const answersRef = useRef(answers);
    const { blackout, resume, suspiciousCountRef } = useScreenshotDeterrent();

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
            {
                answers: answersRef.current,
                suspicious_activity_count: suspiciousCountRef.current,
            },
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
                        {blackout && (
                            <BlackoutOverlay
                                reason={blackout}
                                onResume={resume}
                            />
                        )}

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

                        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs font-medium text-amber-700">
                            <ShieldAlert className="size-3.5" />
                            Screenshot attempts and leaving this tab are
                            detected and logged for your professor.
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
