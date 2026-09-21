import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface FeedbackItem {
    id: number;
    message: string;
    created_at: string;
    student: { id: number; name: string };
    courseware: { id: number; subject: string } | null;
}

interface PaginatedFeedback {
    data: FeedbackItem[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface FeedbackIndexProps {
    feedback: PaginatedFeedback;
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function FeedbackIndex({ feedback }: FeedbackIndexProps) {
    return (
        <>
            <Head title="Sent Feedback" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <MessageSquare className="size-4" />
                            Feedback
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Sent Feedback
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Messages you've sent to students.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {feedback.data.length > 0 ? (
                            <>
                                <div className="divide-y divide-slate-100">
                                    {feedback.data.map((item) => (
                                        <div key={item.id} className="p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-medium text-slate-900">
                                                    {item.student.name}
                                                </p>
                                                <span className="text-xs text-slate-500">
                                                    {formatDate(
                                                        item.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            {item.courseware && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.courseware.subject}
                                                </p>
                                            )}
                                            <p className="mt-2 text-sm text-slate-700">
                                                {item.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {feedback.from ?? 0} to{' '}
                                        {feedback.to ?? 0} of {feedback.total}{' '}
                                        messages
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {feedback.prev_page_url ? (
                                            <Link
                                                href={feedback.prev_page_url}
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
                                            Page {feedback.current_page} of{' '}
                                            {feedback.last_page}
                                        </span>
                                        {feedback.next_page_url ? (
                                            <Link
                                                href={feedback.next_page_url}
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
                                <MessageSquare className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No feedback sent yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Send feedback to a student from their
                                    subject roster.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
