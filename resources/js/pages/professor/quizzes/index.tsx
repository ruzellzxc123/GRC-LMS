import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    EyeOff,
    Pencil,
    Plus,
    Trash2,
    UploadCloud,
} from 'lucide-react';

interface QuizItem {
    id: number;
    title: string;
    is_published: boolean;
    deadline: string | null;
    term: string;
    courseware: { id: number; subject: string };
    questions_count: number;
    attempts_count: number;
}

const TERM_BADGE_STYLES: Record<string, string> = {
    prelims: 'bg-amber-100 text-amber-700',
    midterm: 'bg-blue-100 text-blue-700',
    finals: 'bg-purple-100 text-purple-700',
};

interface PaginatedQuizzes {
    data: QuizItem[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface QuizzesIndexProps {
    quizzes: PaginatedQuizzes;
}

function formatDeadline(date: string | null): string {
    if (!date) {
        return 'No deadline';
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

export default function QuizzesIndex({ quizzes }: QuizzesIndexProps) {
    const togglePublish = (quizId: number) => {
        router.patch(
            `/professor/quizzes/${quizId}/publish`,
            {},
            { preserveScroll: true },
        );
    };

    const destroyQuiz = (quizId: number) => {
        router.delete(`/professor/quizzes/${quizId}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Quizzes" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <ClipboardList className="size-4" />
                                    Quiz Management
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    Quizzes
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Create and manage quizzes for your subjects.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/professor/quizzes/import"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                                >
                                    <UploadCloud className="size-4" />
                                    Import Quiz
                                </Link>
                                <Link
                                    href="/professor/quizzes/create"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                >
                                    <Plus className="size-4" />
                                    New Quiz
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {quizzes.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Quiz
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Subject
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Term
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Questions
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Attempts
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Deadline
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {quizzes.data.map((quiz) => (
                                                <tr
                                                    key={quiz.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4 font-medium text-slate-900">
                                                        {quiz.title}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {
                                                            quiz.courseware
                                                                .subject
                                                        }
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                                TERM_BADGE_STYLES[
                                                                    quiz.term
                                                                ] ??
                                                                'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            {quiz.term}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {quiz.questions_count}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {quiz.attempts_count}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {formatDeadline(
                                                            quiz.deadline,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                quiz.is_published
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {quiz.is_published
                                                                ? 'Published'
                                                                : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    togglePublish(
                                                                        quiz.id,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                            >
                                                                {quiz.is_published ? (
                                                                    <EyeOff className="size-4" />
                                                                ) : (
                                                                    <Eye className="size-4" />
                                                                )}
                                                                {quiz.is_published
                                                                    ? 'Unpublish'
                                                                    : 'Publish'}
                                                            </button>
                                                            <Link
                                                                href={`/professor/quizzes/${quiz.id}/edit`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    destroyQuiz(
                                                                        quiz.id,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {quizzes.from ?? 0} to{' '}
                                        {quizzes.to ?? 0} of {quizzes.total}{' '}
                                        quizzes
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {quizzes.prev_page_url ? (
                                            <Link
                                                href={quizzes.prev_page_url}
                                                preserveScroll
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                <ChevronLeft className="size-4" />
                                                Previous
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">
                                                <ChevronLeft className="size-4" />
                                                Previous
                                            </span>
                                        )}
                                        <span className="px-2 text-sm text-slate-500">
                                            Page {quizzes.current_page} of{' '}
                                            {quizzes.last_page}
                                        </span>
                                        {quizzes.next_page_url ? (
                                            <Link
                                                href={quizzes.next_page_url}
                                                preserveScroll
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Next
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">
                                                Next
                                                <ChevronRight className="size-4" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                                <ClipboardList className="size-10 text-slate-300" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-700">
                                    No quizzes yet
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Create a quiz to see it listed here.
                                </p>
                                <Link
                                    href="/professor/quizzes/create"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    <Plus className="size-4" /> New Quiz
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
