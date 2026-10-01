import { Head, Link } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Calendar,
    ClipboardCheck,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    MessageSquare,
    Plus,
    Sparkles,
    Users,
    Video,
} from 'lucide-react';
import BibleVerseCard from '@/components/bible-verse-card';
import DashboardAvatar from '@/components/dashboard-avatar';
import ScoreBar from '@/components/score-bar';
import SuccessGauge from '@/components/success-gauge';

interface Stats {
    course_count: number;
    student_count: number;
    quiz_count: number;
    pending_grading_count: number;
}

interface Prediction {
    professor_index: number;
    at_risk_enrollment_count: number;
}

interface CourseScore {
    id: number;
    subject: string;
    average_score: number | null;
}

interface PendingSubmission {
    id: number;
    student_name: string;
    item_title: string;
    courseware_id: number;
    item_id: number;
    subject: string;
    submitted_at: string;
}

interface ActivityEntry {
    type: 'feedback' | 'quiz' | 'grade';
    title: string;
    meta: string | null;
    at: string;
}

interface Course {
    id: number;
    subject: string;
    module_title: string;
    enrollments_count: number;
    meeting_link: string;
    uses_embedded_meeting: boolean;
    today_hyflex_mode: 'f2f' | 'online' | null;
}

interface ProfessorDashboardProps {
    stats: Stats;
    prediction: Prediction;
    course_scores: CourseScore[];
    pending_submissions: PendingSubmission[];
    recent_activity: ActivityEntry[];
    courses: Course[];
}

const ACTIVITY_ICONS: Record<ActivityEntry['type'], typeof ClipboardCheck> = {
    feedback: MessageSquare,
    quiz: ClipboardCheck,
    grade: Award,
};

function formatRelative(iso: string): string {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.round(diffHours / 24);

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export default function ProfessorDashboard({
    stats,
    prediction,
    course_scores,
    pending_submissions,
    recent_activity,
    courses,
}: ProfessorDashboardProps) {
    const statCards = [
        {
            title: 'My Subjects',
            value: stats.course_count,
            icon: BookOpen,
        },
        {
            title: 'Total Students',
            value: stats.student_count,
            icon: Users,
        },
        {
            title: 'Quizzes Created',
            value: stats.quiz_count,
            icon: ClipboardList,
        },
        {
            title: 'Pending Grading',
            value: stats.pending_grading_count,
            icon: ClipboardCheck,
        },
    ];

    const insights = [
        prediction.at_risk_enrollment_count > 0 &&
            `${prediction.at_risk_enrollment_count} enrollment${prediction.at_risk_enrollment_count === 1 ? '' : 's'} flagged as at-risk across your subjects.`,
        stats.pending_grading_count > 0 &&
            `${stats.pending_grading_count} submission${stats.pending_grading_count === 1 ? '' : 's'} waiting on your review.`,
    ].filter((insight): insight is string => Boolean(insight));

    return (
        <>
            <Head title="Professor Dashboard" />

            <div className="min-h-full bg-slate-50">
                <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-4 md:px-6 md:pb-6">
                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="flex gap-4">
                                <DashboardAvatar />
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-red-100">
                                        <LayoutDashboard className="size-4" />
                                        GRC LMS — Professor Portal
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                        {stats.course_count > 0
                                            ? `${stats.course_count} subject${stats.course_count === 1 ? '' : 's'}, ${stats.student_count} student${stats.student_count === 1 ? '' : 's'} to watch over.`
                                            : 'No subjects assigned yet.'}
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100 md:text-base">
                                        Manage rosters, attendance, quizzes, and
                                        grading from one dashboard.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                                {statCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <div
                                            key={card.title}
                                            className="rounded-xl bg-white/10 p-3 backdrop-blur-sm"
                                        >
                                            <Icon className="size-4 text-red-100" />
                                            <p className="mt-2 text-lg font-bold">
                                                {card.value}
                                            </p>
                                            <p className="text-xs text-red-100">
                                                {card.title}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <BibleVerseCard />

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">
                                                {card.title}
                                            </p>
                                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                                {card.value}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-red-50 p-3 text-red-700">
                                            <Icon className="size-6" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-slate-900">
                                Class Performance
                            </h2>

                            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
                                {stats.course_count > 0 ? (
                                    <SuccessGauge
                                        value={prediction.professor_index}
                                        label="class index"
                                    />
                                ) : (
                                    <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-slate-50 text-center text-xs text-slate-400">
                                        No data yet
                                    </div>
                                )}

                                <div className="flex-1 space-y-4">
                                    {course_scores.length > 0 ? (
                                        <div className="space-y-2">
                                            {course_scores.map((course) => (
                                                <div
                                                    key={course.id}
                                                    className="flex items-center justify-between gap-3"
                                                >
                                                    <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                                                        {course.subject}
                                                    </span>
                                                    <ScoreBar
                                                        value={
                                                            course.average_score
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No quiz scores recorded yet.
                                        </p>
                                    )}

                                    {insights.length > 0 && (
                                        <div className="space-y-2">
                                            {insights.map((insight) => (
                                                <div
                                                    key={insight}
                                                    className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600"
                                                >
                                                    <Sparkles className="mt-0.5 size-4 shrink-0 text-red-600" />
                                                    <span>{insight}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    Needs Grading
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Oldest submissions first
                                </p>
                            </div>

                            {pending_submissions.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pending_submissions.map((submission) => (
                                        <Link
                                            key={submission.id}
                                            href={`/professor/courses/${submission.courseware_id}/content/items/${submission.item_id}/submissions`}
                                            className="flex items-center justify-between gap-3 p-4 hover:bg-red-50/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {submission.student_name}
                                                </p>
                                                <p className="truncate text-sm text-slate-600">
                                                    {submission.item_title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {submission.subject}
                                                </p>
                                            </div>
                                            <ClipboardCheck className="size-5 shrink-0 text-red-600" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                    <ClipboardCheck className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        All caught up
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        No submissions waiting for review.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        My Subjects
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Manage roster, attendance, and quizzes
                                    </p>
                                </div>
                                <Link
                                    href="/professor/quizzes"
                                    className="text-sm font-semibold text-red-700 hover:text-red-800"
                                >
                                    View quizzes
                                </Link>
                            </div>

                            {courses.length > 0 ? (
                                <div>
                                    {courses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4 first:border-t-0"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/professor/courses/${course.id}/content`}
                                                        className="truncate font-semibold text-slate-900 hover:text-red-700"
                                                    >
                                                        {course.subject}
                                                    </Link>
                                                    {course.uses_embedded_meeting ? (
                                                        <Link
                                                            href={`/professor/courses/${course.id}/meeting`}
                                                            title="Join the online class"
                                                            aria-label="Join the online class"
                                                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                                                        >
                                                            <Video className="size-3.5" />
                                                        </Link>
                                                    ) : (
                                                        <a
                                                            href={
                                                                course.meeting_link
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Join the online class"
                                                            aria-label="Join the online class"
                                                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                                                        >
                                                            <Video className="size-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="truncate text-sm text-slate-500">
                                                    {course.module_title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {course.enrollments_count}{' '}
                                                    students
                                                </p>
                                                {course.today_hyflex_mode && (
                                                    <span
                                                        className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                            course.today_hyflex_mode ===
                                                            'f2f'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-cyan-100 text-cyan-700'
                                                        }`}
                                                    >
                                                        Today:{' '}
                                                        {course.today_hyflex_mode ===
                                                        'f2f'
                                                            ? 'Face-to-Face'
                                                            : 'Synchronous'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Link
                                                    href={`/professor/courses/${course.id}/roster`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                >
                                                    <Users className="size-4" />
                                                    Roster
                                                </Link>
                                                <Link
                                                    href={`/professor/courses/${course.id}/attendance`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                                >
                                                    Attendance
                                                </Link>
                                                <Link
                                                    href={`/professor/courses/${course.id}/grades/prelims`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                                >
                                                    <GraduationCap className="size-4" />
                                                    Grades
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                    <BookOpen className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No subjects assigned yet
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Add your own subject, or ask an admin to
                                        assign you to one.
                                    </p>
                                    <Link
                                        href="/professor/courses?create=1"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        <Plus className="size-4" />
                                        Add Subject
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 px-5 py-4">
                                    <h2 className="font-semibold text-slate-900">
                                        Recent Activity
                                    </h2>
                                </div>

                                {recent_activity.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {recent_activity.map((entry, index) => {
                                            const Icon =
                                                ACTIVITY_ICONS[entry.type];

                                            return (
                                                <div
                                                    key={`${entry.type}-${entry.at}-${index}`}
                                                    className="flex items-center gap-3 p-4"
                                                >
                                                    <div className="rounded-lg bg-red-50 p-2 text-red-700">
                                                        <Icon className="size-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-slate-900">
                                                            {entry.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatRelative(
                                                                entry.at,
                                                            )}
                                                        </p>
                                                    </div>
                                                    {entry.meta && (
                                                        <span className="shrink-0 text-sm font-semibold text-slate-700">
                                                            {entry.meta}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                        <ClipboardCheck className="size-10 text-slate-300" />
                                        <h3 className="mt-3 font-semibold text-slate-700">
                                            No activity yet
                                        </h3>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="font-semibold text-slate-900">
                                    Quick Actions
                                </h2>
                                <div className="mt-4 space-y-2">
                                    <Link
                                        href="/professor/courses?create=1"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <Plus className="size-4 text-red-700" />
                                        Add Subject
                                    </Link>
                                    <Link
                                        href="/professor/quizzes"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <ClipboardList className="size-4 text-red-700" />
                                        Quizzes
                                    </Link>
                                    <Link
                                        href="/professor/grades"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <GraduationCap className="size-4 text-red-700" />
                                        Grades
                                    </Link>
                                    <Link
                                        href="/professor/feedback"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <MessageSquare className="size-4 text-red-700" />
                                        Feedback
                                    </Link>
                                    <Link
                                        href="/professor/calendar"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <Calendar className="size-4 text-red-700" />
                                        Calendar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
