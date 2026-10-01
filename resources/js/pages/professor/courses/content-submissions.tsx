import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    Eye,
    FileText,
    Save,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
}

interface ContentItemInfo {
    id: number;
    title: string;
    deadline: string | null;
    is_past_deadline: boolean;
    max_points: number;
}

interface Submission {
    id: number;
    file_url: string;
    file_name: string;
    submitted_at: string;
    acknowledged_at: string | null;
    graded_at: string | null;
    score: number | null;
}

interface SubmissionRow {
    student_id: number;
    name: string;
    student_number: string | null;
    submission: Submission | null;
    has_late_exception: boolean;
}

interface QuizAttemptRow {
    student_id: number;
    name: string;
    student_number: string | null;
    attempted: boolean;
    submitted_at: string | null;
    duration_seconds: number | null;
    score: number | null;
    correct_count: number | null;
    total_questions: number | null;
    suspicious_activity_count: number | null;
    has_late_exception: boolean;
}

interface QuizGroup {
    id: number;
    title: string;
    deadline: string | null;
    is_past_deadline: boolean;
    rows: QuizAttemptRow[];
}

interface ContentSubmissionsProps {
    courseware: Courseware;
    item: ContentItemInfo;
    rows: SubmissionRow[];
    quizzes: QuizGroup[];
}

type ActiveTab = 'submission' | 'quiz';

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function formatDuration(seconds: number | null): string {
    if (seconds === null) {
        return '—';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return minutes > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${remainingSeconds}s`;
}

export default function ContentSubmissions({
    courseware,
    item,
    rows,
    quizzes,
}: ContentSubmissionsProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('submission');
    const [scores, setScores] = useState<Record<number, string>>(() =>
        Object.fromEntries(
            rows
                .filter((row) => row.submission !== null)
                .map((row) => [
                    row.submission!.id,
                    row.submission!.score === null
                        ? ''
                        : String(row.submission!.score),
                ]),
        ),
    );
    const [savingId, setSavingId] = useState<number | null>(null);
    const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

    const updateScore = (
        submissionId: number,
        rawValue: string,
        maxPoints: number,
    ) => {
        const numValue = Number(rawValue);
        const value =
            rawValue === '' || Number.isNaN(numValue)
                ? rawValue
                : String(
                      Math.min(maxPoints, Math.max(0, Math.round(numValue))),
                  );

        setScores((prev) => ({ ...prev, [submissionId]: value }));
    };

    const acknowledge = (submissionId: number) => {
        setAcknowledgingId(submissionId);

        router.post(
            `/professor/courses/${courseware.id}/content/submissions/${submissionId}/acknowledge`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setAcknowledgingId(null),
            },
        );
    };

    const saveScore = (submissionId: number) => {
        setSavingId(submissionId);

        router.put(
            `/professor/courses/${courseware.id}/content/submissions/${submissionId}`,
            {
                score:
                    scores[submissionId] === '' ? null : scores[submissionId],
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingId(null),
            },
        );
    };

    const [exceptionProcessingId, setExceptionProcessingId] = useState<
        number | null
    >(null);

    const grantSubmissionException = (studentId: number) => {
        setExceptionProcessingId(studentId);

        router.post(
            `/professor/courses/${courseware.id}/content/items/${item.id}/late-exceptions/${studentId}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setExceptionProcessingId(null),
            },
        );
    };

    const revokeSubmissionException = (studentId: number) => {
        setExceptionProcessingId(studentId);

        router.delete(
            `/professor/courses/${courseware.id}/content/items/${item.id}/late-exceptions/${studentId}`,
            {
                preserveScroll: true,
                onFinish: () => setExceptionProcessingId(null),
            },
        );
    };

    const grantQuizException = (
        quizId: number,
        studentId: number,
        alreadyAttempted: boolean,
    ) => {
        if (
            alreadyAttempted &&
            !window.confirm(
                'This student already completed this quiz. Granting this will erase their existing result and let them retake it — continue?',
            )
        ) {
            return;
        }

        setExceptionProcessingId(studentId);

        router.post(
            `/professor/quizzes/${quizId}/late-exceptions/${studentId}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setExceptionProcessingId(null),
            },
        );
    };

    const revokeQuizException = (quizId: number, studentId: number) => {
        setExceptionProcessingId(studentId);

        router.delete(
            `/professor/quizzes/${quizId}/late-exceptions/${studentId}`,
            {
                preserveScroll: true,
                onFinish: () => setExceptionProcessingId(null),
            },
        );
    };

    const submittedCount = rows.filter((row) => row.submission).length;

    return (
        <>
            <Head title={`Submissions — ${item.title}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/content`}
                    >
                        Back to content
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <ClipboardCheck className="size-4" />
                            {courseware.subject}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Submissions — {item.title}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            {submittedCount} of {rows.length} students have
                            submitted.
                        </p>
                    </section>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('submission')}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                activeTab === 'submission'
                                    ? 'bg-red-600 text-white'
                                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Submission
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('quiz')}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                activeTab === 'quiz'
                                    ? 'bg-red-600 text-white'
                                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Quiz
                        </button>
                    </div>

                    {activeTab === 'submission' && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {rows.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Student
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Submission
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Submitted
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Reviewed
                                                </th>
                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Score
                                                </th>
                                                {item.is_past_deadline && (
                                                    <th className="px-5 py-3 font-semibold">
                                                        Late Exception
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rows.map((row) => (
                                                <tr
                                                    key={row.student_id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-slate-900">
                                                            {row.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {row.student_number ??
                                                                '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {row.submission ? (
                                                            <a
                                                                href={
                                                                    row
                                                                        .submission
                                                                        .file_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800"
                                                            >
                                                                <FileText className="size-3.5" />
                                                                {
                                                                    row
                                                                        .submission
                                                                        .file_name
                                                                }
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">
                                                                Not submitted
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {row.submission
                                                            ? formatDate(
                                                                  row.submission
                                                                      .submitted_at,
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {row.submission ? (
                                                            row.submission
                                                                .acknowledged_at ? (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    {formatDate(
                                                                        row
                                                                            .submission
                                                                            .acknowledged_at,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        acknowledge(
                                                                            row
                                                                                .submission!
                                                                                .id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        acknowledgingId ===
                                                                        row
                                                                            .submission
                                                                            .id
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                    {acknowledgingId ===
                                                                    row
                                                                        .submission
                                                                        .id
                                                                        ? 'Saving...'
                                                                        : 'Acknowledge'}
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="text-sm text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {row.submission ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={
                                                                        item.max_points
                                                                    }
                                                                    step="1"
                                                                    placeholder="—"
                                                                    value={
                                                                        scores[
                                                                            row
                                                                                .submission
                                                                                .id
                                                                        ] ?? ''
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateScore(
                                                                            row
                                                                                .submission!
                                                                                .id,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                            item.max_points,
                                                                        )
                                                                    }
                                                                    className="h-9 w-16 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                                                />
                                                                <span className="text-xs text-slate-400">
                                                                    /
                                                                    {
                                                                        item.max_points
                                                                    }
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        saveScore(
                                                                            row
                                                                                .submission!
                                                                                .id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        savingId ===
                                                                        row
                                                                            .submission
                                                                            .id
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Save className="size-3.5" />
                                                                    Save
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    {item.is_past_deadline && (
                                                        <td className="px-5 py-4">
                                                            {row.has_late_exception ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        revokeSubmissionException(
                                                                            row.student_id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        exceptionProcessingId ===
                                                                        row.student_id
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Granted —
                                                                    Revoke
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        grantSubmissionException(
                                                                            row.student_id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        exceptionProcessingId ===
                                                                        row.student_id
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Grant Late
                                                                    Exception
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                    <ClipboardCheck className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No students enrolled yet
                                    </h3>
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'quiz' &&
                        (quizzes.length > 0 ? (
                            quizzes.map((quiz) => {
                                const showExceptionColumn =
                                    quiz.is_past_deadline ||
                                    quiz.rows.some((row) => row.attempted);

                                return (
                                    <section
                                        key={quiz.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        <div className="border-b border-slate-200 px-5 py-4">
                                            <h2 className="font-semibold text-slate-900">
                                                {quiz.title}
                                            </h2>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[800px] text-left">
                                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Student
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Quiz
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Submitted
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Duration
                                                        </th>
                                                        <th className="px-5 py-3 text-right font-semibold">
                                                            Score
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Flags
                                                        </th>
                                                        {showExceptionColumn && (
                                                            <th className="px-5 py-3 font-semibold">
                                                                Late Exception
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {quiz.rows.map((row) => (
                                                        <tr
                                                            key={row.student_id}
                                                            className="hover:bg-red-50/40"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <p className="font-medium text-slate-900">
                                                                    {row.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {row.student_number ??
                                                                        '—'}
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {row.attempted ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                                                                        <CheckCircle2 className="size-3.5" />
                                                                        Completed
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                                                                        <XCircle className="size-3.5" />
                                                                        Not
                                                                        attempted
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                                {row.submitted_at
                                                                    ? formatDate(
                                                                          row.submitted_at,
                                                                      )
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                                {formatDuration(
                                                                    row.duration_seconds,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                                                                {row.score !==
                                                                null
                                                                    ? `${row.correct_count}/${row.total_questions}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {row.suspicious_activity_count !==
                                                                    null &&
                                                                row.suspicious_activity_count >
                                                                    0 ? (
                                                                    <span
                                                                        title="Number of times the student left the quiz tab or triggered a screenshot key while attempting"
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                                                    >
                                                                        <AlertTriangle className="size-3.5" />
                                                                        {
                                                                            row.suspicious_activity_count
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-slate-300">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>
                                                            {showExceptionColumn && (
                                                                <td className="px-5 py-4">
                                                                    {row.has_late_exception ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                revokeQuizException(
                                                                                    quiz.id,
                                                                                    row.student_id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                exceptionProcessingId ===
                                                                                row.student_id
                                                                            }
                                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            Granted
                                                                            —
                                                                            Revoke
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                grantQuizException(
                                                                                    quiz.id,
                                                                                    row.student_id,
                                                                                    row.attempted,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                exceptionProcessingId ===
                                                                                row.student_id
                                                                            }
                                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {row.attempted
                                                                                ? 'Allow Retake'
                                                                                : 'Grant Late Exception'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                );
                            })
                        ) : (
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                    <ClipboardCheck className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No quizzes for this term yet
                                    </h3>
                                </div>
                            </section>
                        ))}
                </div>
            </div>
        </>
    );
}
