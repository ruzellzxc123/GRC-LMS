import { Head, Link } from '@inertiajs/react';
import { BarChart3, FileText, LayoutDashboard } from 'lucide-react';

interface Report {
    id: number;
    title: string;
    summary: string;
    generated_at: string;
}

interface ReportsIndexProps {
    reports: Report[];
}

export default function ReportsIndex({ reports }: ReportsIndexProps) {
    return (
        <>
            <Head title="Reports" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1400px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <BarChart3 className="size-4" />
                                    Report Center
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    Reports
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Review generated LMS reports and performance
                                    snapshots.
                                </p>
                            </div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <LayoutDashboard className="size-4" /> Dashboard
                            </Link>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    Available Reports
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Download or review recent LMS summaries.
                                </p>
                            </div>

                            {reports.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    Report
                                                </th>
                                                <th className="px-5 py-3">
                                                    Generated
                                                </th>
                                                <th className="px-5 py-3">
                                                    Summary
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reports.map((report) => (
                                                <tr
                                                    key={report.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4 font-medium text-slate-900">
                                                        {report.title}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {report.generated_at}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {report.summary}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex min-h-56 flex-col items-center justify-center px-6 py-14 text-center">
                                    <FileText className="size-12 text-slate-300" />
                                    <h3 className="mt-4 text-xl font-semibold text-slate-800">
                                        No reports generated
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Reports will appear here once available.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3 text-slate-900">
                                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Report Guide
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Use these reports to monitor student
                                        progress, subject usage, and term
                                        performance.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4">
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">
                                        Student summary
                                    </p>
                                    <p className="mt-1">
                                        View total enrollment, active subjects,
                                        and student readiness.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">
                                        Subject performance
                                    </p>
                                    <p className="mt-1">
                                        Monitor subject completion and term
                                        assignments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
