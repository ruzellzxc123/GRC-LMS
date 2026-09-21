import { Head, Link, router, usePoll } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Eye,
    Search,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface SubmissionRow {
    id: number;
    student_name: string;
    student_number: string | null;
    item_title: string;
    subject: string;
    professor_name: string;
    file_name: string;
    submitted_at: string;
    acknowledged_at: string | null;
    graded_at: string | null;
    score: number | null;
    max_points: number;
}

interface PaginatedSubmissions {
    data: SubmissionRow[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Stats {
    total: number;
    acknowledged: number;
    graded: number;
}

interface GradingOversightProps {
    submissions: PaginatedSubmissions;
    stats: Stats;
    filters: {
        search: string;
    };
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function ReviewStatus({ row }: { row: SubmissionRow }) {
    if (row.graded_at) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Graded {formatDate(row.graded_at)}
            </span>
        );
    }

    if (row.acknowledged_at) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Eye className="size-3.5" />
                Reviewed {formatDate(row.acknowledged_at)}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            <Clock className="size-3.5" />
            Awaiting review
        </span>
    );
}

export default function GradingOversightIndex({
    submissions,
    stats,
    filters,
}: GradingOversightProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Keep the oversight table current without a manual refresh — a
    // lightweight poll, same mechanism as the student notification badges.
    usePoll(20000, { only: ['submissions', 'stats'] }, { keepAlive: true });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/admin/grading',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch('');
        router.get(
            '/admin/grading',
            {},
            { preserveState: true, replace: true },
        );
    };

    const notReviewed = stats.total - stats.acknowledged;
    const notGraded = stats.total - stats.graded;

    return (
        <>
            <Head title="Grading Oversight" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <ClipboardCheck className="size-4" />
                            Grading Oversight
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Professor Grading Activity
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Every student submission across every subject, with
                            when a professor reviewed it and when it was scored.
                            A graded score syncs into the student's gradebook
                            the moment it's saved — this list refreshes
                            automatically.
                        </p>
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Total submissions
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {stats.total}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Awaiting review
                            </p>
                            <p
                                className={`mt-2 text-2xl font-bold ${notReviewed > 0 ? 'text-amber-600' : 'text-slate-900'}`}
                            >
                                {notReviewed}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Not yet graded
                            </p>
                            <p
                                className={`mt-2 text-2xl font-bold ${notGraded > 0 ? 'text-amber-600' : 'text-slate-900'}`}
                            >
                                {notGraded}
                            </p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    All Submissions
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {submissions.total} total, most recent
                                    activity first
                                </p>
                            </div>

                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 md:max-w-md"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search student, subject, or professor..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                    />
                                    {search !== '' && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-red-600"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        {submissions.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Student
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Subject
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Professor
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Item
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Score
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {submissions.data.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-slate-900">
                                                            {row.student_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {row.student_number ??
                                                                '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {row.subject}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {row.professor_name}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {row.item_title}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <ReviewStatus
                                                            row={row}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                                                        {row.score !== null ? (
                                                            `${row.score}/${row.max_points}`
                                                        ) : (
                                                            <span className="font-normal text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {submissions.from ?? 0} to{' '}
                                        {submissions.to ?? 0} of{' '}
                                        {submissions.total} submissions
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {submissions.prev_page_url ? (
                                            <Link
                                                href={submissions.prev_page_url}
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
                                            Page {submissions.current_page} of{' '}
                                            {submissions.last_page}
                                        </span>
                                        {submissions.next_page_url ? (
                                            <Link
                                                href={submissions.next_page_url}
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
                            <div className="flex min-h-64 flex-col items-center justify-center text-center">
                                <ClipboardCheck className="size-12 text-slate-300" />
                                <h3 className="mt-4 font-semibold text-slate-700">
                                    No submissions yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Grading activity will show up here once
                                    students start submitting work.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
