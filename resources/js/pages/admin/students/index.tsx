import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Search,
    TrendingUp,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Student {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
    year_level: string | null;
    section: string | null;
}

interface PaginatedStudents {
    data: Student[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface StudentsIndexProps {
    students: PaginatedStudents;

    filters: {
        search: string;
    };
}

export default function StudentsIndex({
    students,
    filters,
}: StudentsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/admin/students',
            {
                search,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearSearch = () => {
        setSearch('');

        router.get(
            '/admin/students',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Students" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <Users className="size-4" />
                                    Student Management
                                </div>

                                <h1 className="mt-2 text-2xl font-bold">
                                    List of Students
                                </h1>

                                <p className="mt-2 text-sm text-red-100">
                                    View and update registered student
                                    information.
                                </p>
                            </div>

                            <Link
                                href="/admin/students/create"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <UserPlus className="size-4" />
                                Add Student
                            </Link>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    All Students
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {students.total} registered students
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

                        {students.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Name
                                                </th>

                                                <th className="px-5 py-3 font-semibold">
                                                    Section
                                                </th>

                                                <th className="px-5 py-3 font-semibold">
                                                    Year Level
                                                </th>

                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {students.data.map((student) => (
                                                <tr
                                                    key={student.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                                                                {student.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {student.student_id ??
                                                                        student.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {student.section ??
                                                            'Not assigned'}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {student.year_level ??
                                                            'Not assigned'}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <div className="inline-flex gap-2">
                                                            <Link
                                                                href={`/admin/performance/students/${student.id}`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                            >
                                                                <TrendingUp className="size-4" />
                                                                Performance
                                                            </Link>
                                                            <Link
                                                                href={`/admin/students/${student.id}/edit`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {students.from ?? 0} to{' '}
                                        {students.to ?? 0} of {students.total}{' '}
                                        students
                                    </p>

                                    <div className="flex items-center gap-2">
                                        {students.prev_page_url ? (
                                            <Link
                                                href={students.prev_page_url}
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
                                            Page {students.current_page} of{' '}
                                            {students.last_page}
                                        </span>

                                        {students.next_page_url ? (
                                            <Link
                                                href={students.next_page_url}
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
                                <Users className="size-12 text-slate-300" />

                                <h3 className="mt-4 font-semibold text-slate-700">
                                    No students found
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Try changing your search or add a new
                                    student.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
