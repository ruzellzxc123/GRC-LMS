import { Head, Link } from '@inertiajs/react';
import { ChevronRight, FileVideo, ImageIcon, Video } from 'lucide-react';
import BackLink from '@/components/back-link';

interface Professor {
    id: number;
    name: string;
    email: string;
}

interface ReportRow {
    id: number;
    subject: string;
    class_date: string;
    submitted_at: string;
    has_video: boolean;
    screenshot_count: number;
    has_session: boolean;
}

interface ClassReportsListProps {
    professor: Professor;
    reports: ReportRow[];
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function ClassReportsList({
    professor,
    reports,
}: ClassReportsListProps) {
    return (
        <>
            <Head title={`Class Reports — ${professor.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1100px] space-y-6">
                    <BackLink href="/admin/class-reports">
                        Back to professors
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Class Reports
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {professor.name}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            {professor.email}
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {reports.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {reports.map((report) => (
                                    <li key={report.id}>
                                        <Link
                                            href={`/admin/class-reports/${report.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-red-50/40"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {report.subject}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatDate(
                                                        report.class_date,
                                                    )}
                                                    {!report.has_session &&
                                                        ' · No meeting session'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {report.has_video && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        <Video className="size-3.5" />
                                                        Video
                                                    </span>
                                                )}
                                                {report.screenshot_count >
                                                    0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        <ImageIcon className="size-3.5" />
                                                        {
                                                            report.screenshot_count
                                                        }
                                                    </span>
                                                )}
                                                <ChevronRight className="size-4 text-slate-400" />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <FileVideo className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No reports submitted yet
                                </h3>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
