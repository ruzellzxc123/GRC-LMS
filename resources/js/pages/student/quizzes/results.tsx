import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Clock,
    XCircle,
} from 'lucide-react';
import BackLink from '@/components/back-link';
import ScoreBar from '@/components/score-bar';

interface Quiz {
    id: number;
    title: string;
    description: string | null;
}

interface Attempt {
    correct_count: number;
    total_questions: number;
    score: number;
    duration_seconds: number | null;
    auto_submitted: boolean;
}

function formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

interface ResponseReview {
    question: string;
    chosen_option: string;
    is_correct: boolean;
}

interface ResultsProps {
    quiz: Quiz;
    attempt: Attempt;
    responses: ResponseReview[];
}

export default function Results({ quiz, attempt, responses }: ResultsProps) {
    return (
        <>
            <Head title={`${quiz.title} — Results`} />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href="/student/courses">
                        Back to subjects
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {quiz.title}
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        {attempt.correct_count} /{' '}
                                        {attempt.total_questions} correct
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="text-3xl font-bold text-slate-900">
                                    {attempt.correct_count}/
                                    {attempt.total_questions}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    {attempt.score}%
                                </span>
                                <ScoreBar value={attempt.score} />
                            </div>

                            {(attempt.duration_seconds !== null ||
                                attempt.auto_submitted) && (
                                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                    {attempt.duration_seconds !== null && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
                                            <Clock className="size-3.5" />
                                            Finished in{' '}
                                            {formatDuration(
                                                attempt.duration_seconds,
                                            )}
                                        </span>
                                    )}
                                    {attempt.auto_submitted && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                                            <AlertTriangle className="size-3.5" />
                                            Auto-submitted when time ran out
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-3">
                                {responses.map((response, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-xl border p-4 ${
                                            response.is_correct
                                                ? 'border-emerald-200 bg-emerald-50'
                                                : 'border-red-200 bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {response.is_correct ? (
                                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                            ) : (
                                                <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {response.question}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Your answer:{' '}
                                                    {response.chosen_option}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
