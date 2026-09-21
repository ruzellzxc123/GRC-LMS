import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    GraduationCap,
    Pencil,
    Plus,
    Search,
    TrendingUp,
    UserX,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Professor {
    id: number;
    professor_id: string | null;
    name: string;
    email: string;
    department: string | null;
    program: string | null;
    is_active: boolean;
}

interface ProfessorsPagination {
    data: Professor[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface ProfessorsIndexProps {
    professors: ProfessorsPagination;

    filters: {
        search: string;
    };
}

export default function ProfessorsIndex({
    professors,
    filters,
}: ProfessorsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/admin/professors',
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
            '/admin/professors',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Professors" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <GraduationCap className="size-4" />
                                    Professor Management
                                </div>

                                <h1 className="mt-2 text-2xl font-bold">
                                    Professors
                                </h1>

                                <p className="mt-2 text-sm text-red-100">
                                    Manage professor accounts and access.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/admin/performance/professors"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                                >
                                    <TrendingUp className="size-4" />
                                    View Performance
                                </Link>
                                <Link
                                    href="/admin/professors/create"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                >
                                    <Plus className="size-4" />
                                    Add Professor
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    List of Professors
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {professors.total} professor accounts
                                </p>
                            </div>

                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 md:max-w-md"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search professors..."
                                        className="h-10 w-full rounded-lg border border-slate-300 pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                    />

                                    {search && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute top-1/2 right-3 -translate-y-1/2"
                                        >
                                            <X className="size-4 text-slate-400" />
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

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Professor</th>

                                        <th className="px-5 py-3">
                                            Department
                                        </th>

                                        <th className="px-5 py-3">Program</th>

                                        <th className="px-5 py-3">Status</th>

                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {professors.data.map((professor) => (
                                        <tr
                                            key={professor.id}
                                            className="hover:bg-red-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                                                        {professor.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {professor.name}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {professor.professor_id ??
                                                                professor.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {professor.department ??
                                                    'Not assigned'}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {professor.program ??
                                                    'Not specified'}
                                            </td>

                                            <td className="px-5 py-4">
                                                {professor.is_active ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/admin/professors/${professor.id}/edit`}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Link>

                                                    <Link
                                                        href={`/admin/professors/${professor.id}/status`}
                                                        method="patch"
                                                        as="button"
                                                        preserveScroll
                                                        className={
                                                            professor.is_active
                                                                ? 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50'
                                                                : 'inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100'
                                                        }
                                                    >
                                                        {professor.is_active ? (
                                                            <>
                                                                <UserX className="size-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="size-4" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {professors.data.length === 0 && (
                            <div className="flex min-h-64 flex-col items-center justify-center text-center">
                                <GraduationCap className="size-12 text-slate-300" />

                                <h3 className="mt-4 font-semibold text-slate-700">
                                    No professors found
                                </h3>

                                <Link
                                    href="/admin/professors/create"
                                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Add Professor
                                </Link>
                            </div>
                        )}

                        {professors.data.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 p-5">
                                <p className="text-sm text-slate-500">
                                    Showing {professors.from ?? 0} to{' '}
                                    {professors.to ?? 0} of {professors.total}
                                </p>

                                <div className="flex gap-2">
                                    {professors.prev_page_url && (
                                        <Link
                                            href={professors.prev_page_url}
                                            className="rounded-lg border px-3 py-2 text-sm"
                                        >
                                            Previous
                                        </Link>
                                    )}

                                    {professors.next_page_url && (
                                        <Link
                                            href={professors.next_page_url}
                                            className="rounded-lg border px-3 py-2 text-sm"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
