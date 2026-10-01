import { Head, Link } from '@inertiajs/react';
import { ChevronRight, FileVideo, Users } from 'lucide-react';
import BackLink from '@/components/back-link';

interface ReportProfessor {
    id: number;
    name: string;
    email: string;
    department: string | null;
    class_reports_count: number;
}

interface ClassReportProfessorsProps {
    professors: ReportProfessor[];
}

export default function ClassReportProfessors({
    professors,
}: ClassReportProfessorsProps) {
    return (
        <>
            <Head title="Class Reports" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1100px] space-y-6">
                    <BackLink href="/admin/dashboard">
                        Back to dashboard
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Class Reports
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            By Professor
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Video recordings, screenshots, and attendance
                            submitted by professors for their classes. Pick a
                            professor to see what they've submitted.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {professors.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {professors.map((professor) => (
                                    <li key={professor.id}>
                                        <Link
                                            href={`/admin/class-reports/professors/${professor.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-red-50/40"
                                        >
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
                                                        {professor.department ??
                                                            professor.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                                    {
                                                        professor.class_reports_count
                                                    }{' '}
                                                    reports
                                                </span>
                                                <ChevronRight className="size-4 text-slate-400" />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <Users className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No class reports yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    This list fills in once professors submit
                                    reports for their classes.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
