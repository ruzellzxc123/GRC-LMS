import { Head } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import BackLink from '@/components/back-link';

interface Quiz {
    id: number;
    title: string;
    description: string | null;
}

interface BlockedQuizProps {
    quiz: Quiz;
    deadline: string;
}

function formatDeadline(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

export default function BlockedQuiz({ quiz, deadline }: BlockedQuizProps) {
    return (
        <>
            <Head title={quiz.title} />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-lg">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <Lock className="size-7" />
                                <div>
                                    <h1 className="text-xl font-bold">
                                        {quiz.title}
                                    </h1>
                                    {quiz.description && (
                                        <p className="mt-1 text-sm text-red-100">
                                            {quiz.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 text-center">
                            <p className="font-semibold text-slate-900">
                                You're past this quiz's deadline.
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                Please ask your professor for permission to
                                attempt this quiz.
                            </p>
                            <p className="mt-4 text-xs text-slate-400">
                                Deadline was {formatDeadline(deadline)}
                            </p>

                            <BackLink
                                href="/student/courses"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800"
                            >
                                Back to subjects
                            </BackLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
