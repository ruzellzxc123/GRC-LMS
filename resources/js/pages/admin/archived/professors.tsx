import { Head, Link } from '@inertiajs/react';
import { Archive, ChevronRight, Users } from 'lucide-react';
import BackLink from '@/components/back-link';

interface ArchivedProfessor {
    id: number;
    name: string;
    email: string;
    department: string | null;
    archived_subjects_count: number;
}

interface ArchivedProfessorsProps {
    professors: ArchivedProfessor[];
}

export default function ArchivedProfessors({
    professors,
}: ArchivedProfessorsProps) {
    return (
        <>
            <Head title="Archived Subjects" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1100px] space-y-6">
                    <BackLink href="/admin/dashboard">
                        Back to dashboard
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Archive className="size-4" />
                            Archived Subjects
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            By Professor
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Subjects archive automatically once their academic
                            term ends. Pick a professor to see their archived
                            subjects and review what each one contains.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {professors.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {professors.map((professor) => (
                                    <li key={professor.id}>
                                        <Link
                                            href={`/admin/archived/professors/${professor.id}`}
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
                                                        professor.archived_subjects_count
                                                    }{' '}
                                                    archived
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
                                    No archived subjects yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    This list fills in automatically once a
                                    subject's academic term end date has passed.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
