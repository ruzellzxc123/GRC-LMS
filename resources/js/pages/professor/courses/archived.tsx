import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface AcademicTerm {
    id: number;
    name: string;
    semester: string | null;
}

interface ArchivedCourse {
    id: number;
    subject: string;
    subject_code: string | null;
    module_title: string;
    year_level: string | null;
    section: string | null;
    archived_at: string | null;
    academic_term: AcademicTerm | null;
    department: { name: string } | null;
}

interface PaginatedCourses {
    data: ArchivedCourse[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface ArchivedProps {
    courses: PaginatedCourses;
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function Archived({ courses }: ArchivedProps) {
    const [reusingId, setReusingId] = useState<number | null>(null);

    const reuse = (course: ArchivedCourse) => {
        if (
            !confirm(
                `Bring "${course.subject}" back into active use for a new term? Its content, quizzes, and grade setup stay exactly as they are — only the previous students are already gone. You'll land on its edit page to update the details.`,
            )
        ) {
            return;
        }

        setReusingId(course.id);

        router.post(
            `/professor/courses/${course.id}/reuse`,
            {},
            { onFinish: () => setReusingId(null) },
        );
    };

    return (
        <>
            <Head title="Archived Subjects" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1300px] space-y-6">
                    <BackLink href="/professor/courses">
                        Back to subjects
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Archive className="size-4" />
                            Archived Subjects
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Past Subjects
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Subjects archive automatically once their academic
                            term ends, and their students are unenrolled.
                            Everything else — modules, quizzes, grade setup —
                            stays put, so you can reuse a subject for a new term
                            instead of rebuilding it.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {courses.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Subject
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Last Term
                                                </th>
                                                <th className="px-5 py-3 font-semibold">
                                                    Archived
                                                </th>
                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {courses.data.map((course) => (
                                                <tr
                                                    key={course.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-slate-900">
                                                            {course.subject}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {course.subject_code ??
                                                                course.module_title}
                                                            {course.section
                                                                ? ` · Section ${course.section}`
                                                                : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {course.academic_term
                                                            ? course
                                                                  .academic_term
                                                                  .name
                                                            : 'No term set'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {formatDate(
                                                            course.archived_at,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                reuse(course)
                                                            }
                                                            disabled={
                                                                reusingId ===
                                                                course.id
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <RotateCcw className="size-4" />
                                                            {reusingId ===
                                                            course.id
                                                                ? 'Reusing...'
                                                                : 'Reuse'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {courses.from ?? 0} to{' '}
                                        {courses.to ?? 0} of {courses.total}{' '}
                                        archived subjects
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {courses.prev_page_url ? (
                                            <Link
                                                href={courses.prev_page_url}
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
                                            Page {courses.current_page} of{' '}
                                            {courses.last_page}
                                        </span>
                                        {courses.next_page_url ? (
                                            <Link
                                                href={courses.next_page_url}
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
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <BookOpen className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No archived subjects
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Subjects move here automatically once their
                                    academic term ends.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
