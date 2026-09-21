import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
}

interface PaginatedDepartments {
    data: Department[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface DepartmentsIndexProps {
    departments: PaginatedDepartments;
    filters: {
        search: string;
    };
}

export default function DepartmentsIndex({
    departments,
    filters,
}: DepartmentsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/admin/departments',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch('');
        router.get(
            '/admin/departments',
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Departments" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <Plus className="size-4" />
                                    Department Management
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    Departments
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Manage curriculum departments used by
                                    subject records.
                                </p>
                            </div>
                            <Link
                                href="/admin/departments/create"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <Plus className="size-4" /> Add Department
                            </Link>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    All Departments
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {departments.total} departments
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
                                        placeholder="Search departments..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                    />
                                    {search && (
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

                        {departments.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    Department
                                                </th>
                                                <th className="px-5 py-3">
                                                    Code
                                                </th>
                                                <th className="px-5 py-3">
                                                    Description
                                                </th>
                                                <th className="px-5 py-3 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {departments.data.map(
                                                (department) => (
                                                    <tr
                                                        key={department.id}
                                                        className="hover:bg-red-50/40"
                                                    >
                                                        <td className="px-5 py-4 font-medium text-slate-900">
                                                            {department.name}
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                            {department.code}
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                            {department.description ??
                                                                'No description'}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <Link
                                                                href={`/admin/departments/${department.id}/edit`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                            >
                                                                Edit
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {departments.from ?? 0} to{' '}
                                        {departments.to ?? 0} of{' '}
                                        {departments.total} departments
                                    </p>
                                    <div className="flex gap-2">
                                        {departments.prev_page_url ? (
                                            <Link
                                                href={departments.prev_page_url}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                <ChevronLeft className="size-4" />{' '}
                                                Previous
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">
                                                <ChevronLeft className="size-4" />{' '}
                                                Previous
                                            </span>
                                        )}
                                        {departments.next_page_url ? (
                                            <Link
                                                href={departments.next_page_url}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Next{' '}
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">
                                                Next{' '}
                                                <ChevronRight className="size-4" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                                <h3 className="text-xl font-semibold text-slate-700">
                                    No departments found
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Create a department to categorize subjects.
                                </p>
                                <Link
                                    href="/admin/departments/create"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    <Plus className="size-4" /> Add Department
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
