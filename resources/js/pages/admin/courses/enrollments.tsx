import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
}

interface EnrolledStudent {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
}

interface Enrollment {
    id: number;
    student: EnrolledStudent;
}

interface PaginatedEnrollments {
    data: Enrollment[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Candidate {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
}

interface EnrollmentsProps {
    courseware: Courseware;
    enrollments: PaginatedEnrollments;
    candidates: Candidate[];
    filters: {
        student_search: string;
    };
}

export default function Enrollments({
    courseware,
    enrollments,
    candidates,
    filters,
}: EnrollmentsProps) {
    const [search, setSearch] = useState(filters.student_search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            `/admin/courses/${courseware.id}/enrollments`,
            { student_search: search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch('');

        router.get(
            `/admin/courses/${courseware.id}/enrollments`,
            {},
            { preserveState: true, replace: true },
        );
    };

    const enrollStudent = (studentId: number) => {
        router.post(
            `/admin/courses/${courseware.id}/enrollments`,
            { student_id: studentId },
            { preserveScroll: true },
        );
    };

    const unenrollStudent = (enrollmentId: number) => {
        router.delete(
            `/admin/courses/${courseware.id}/enrollments/${enrollmentId}`,
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`Enrollment — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <BackLink href="/admin/courses">Back to subjects</BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Users className="size-4" />
                            Enrollment Management
                        </div>

                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                            {courseware.course_code
                                ? ` (${courseware.course_code})`
                                : ''}
                        </h1>

                        <p className="mt-2 text-sm text-red-100">
                            Manage which students are enrolled in this subject.
                        </p>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5">
                                <h2 className="font-semibold text-slate-900">
                                    Enrolled Students
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {enrollments.total} students enrolled
                                </p>
                            </div>

                            {enrollments.data.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-left">
                                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold">
                                                        Student
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {enrollments.data.map(
                                                    (enrollment) => (
                                                        <tr
                                                            key={enrollment.id}
                                                            className="hover:bg-red-50/40"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        enrollment
                                                                            .student
                                                                            .name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {enrollment
                                                                        .student
                                                                        .student_id ??
                                                                        enrollment
                                                                            .student
                                                                            .email}
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        unenrollStudent(
                                                                            enrollment.id,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                                >
                                                                    <UserMinus className="size-4" />
                                                                    Unenroll
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                        <p className="text-sm text-slate-500">
                                            Showing {enrollments.from ?? 0} to{' '}
                                            {enrollments.to ?? 0} of{' '}
                                            {enrollments.total} students
                                        </p>

                                        <div className="flex items-center gap-2">
                                            {enrollments.prev_page_url ? (
                                                <Link
                                                    href={
                                                        enrollments.prev_page_url
                                                    }
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
                                                Page {enrollments.current_page}{' '}
                                                of {enrollments.last_page}
                                            </span>

                                            {enrollments.next_page_url ? (
                                                <Link
                                                    href={
                                                        enrollments.next_page_url
                                                    }
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
                                    <Users className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No students enrolled
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Enroll students using the panel on the
                                        right.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5">
                                <h2 className="font-semibold text-slate-900">
                                    Enroll a Student
                                </h2>

                                <form
                                    onSubmit={submitSearch}
                                    className="mt-4 flex gap-2"
                                >
                                    <div className="relative flex-1">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search students..."
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

                            <div className="divide-y divide-slate-100">
                                {candidates.length > 0 ? (
                                    candidates.map((candidate) => (
                                        <div
                                            key={candidate.id}
                                            className="flex items-center justify-between gap-3 p-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-900">
                                                    {candidate.name}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {candidate.student_id ??
                                                        candidate.email}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    enrollStudent(candidate.id)
                                                }
                                                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                            >
                                                <UserPlus className="size-4" />
                                                Enroll
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-sm text-slate-500">
                                        No unenrolled students found.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
