import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CalendarCheck,
    CalendarClock,
    ClipboardCheck,
    ClipboardList,
    Clock,
    GraduationCap,
    LayoutDashboard,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import BibleVerseCard from '@/components/bible-verse-card';
import DashboardAvatar from '@/components/dashboard-avatar';
import SuccessGauge from '@/components/success-gauge';
import type { Auth } from '@/types';

interface Stats {
    course_count: number;
    attendance_rate: number | null;
    pending_quiz_count: number;
    study_minutes_this_week: number;
}

interface Prediction {
    composite_score: number;
    label: string;
    risk_level: 'low' | 'medium' | 'high';
    attendance_rate: number | null;
    academic_average: number | null;
    flags: string[];
}

interface TrendPoint {
    label: string;
    score: number;
    date: string;
}

interface PendingQuiz {
    id: number;
    title: string;
    course_subject: string;
    deadline: string | null;
}

interface ActivityEntry {
    type: 'quiz' | 'feedback' | 'grade';
    title: string;
    meta: string | null;
    at: string;
}

interface StudentDashboardProps {
    stats: Stats;
    prediction: Prediction;
    performance_trend: TrendPoint[];
    pending_quizzes: PendingQuiz[];
    recent_activity: ActivityEntry[];
}

interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

const FLAG_MESSAGES: Record<string, string> = {
    low_attendance: 'Your attendance rate is below the healthy threshold.',
    low_academic_performance:
        'Your grades across quizzes, assignments, activities, recitation, and exams are trending below a passing level.',
    incomplete_profile:
        'Your profile is missing information professors may need.',
};

const RISK_STYLES: Record<Prediction['risk_level'], string> = {
    low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    high: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const ACTIVITY_ICONS: Record<ActivityEntry['type'], typeof ClipboardCheck> = {
    quiz: ClipboardCheck,
    feedback: MessageSquare,
    grade: Award,
};

function formatPercent(value: number | null): string {
    return value === null ? 'N/A' : `${value}%`;
}

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

function formatDeadline(iso: string | null): string {
    if (!iso) {
        return 'No deadline';
    }

    const date = new Date(iso);
    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'Past due';
    }

    if (diffDays === 0) {
        return 'Due today';
    }

    if (diffDays === 1) {
        return 'Due tomorrow';
    }

    if (diffDays <= 7) {
        return `Due in ${diffDays} days`;
    }

    return `Due ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function TrendChart({ points }: { points: TrendPoint[] }) {
    if (points.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <GraduationCap className="size-10 text-slate-300" />
                <h3 className="mt-3 font-semibold text-slate-700">
                    No quiz attempts yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Scores will chart here once you take quizzes.
                </p>
            </div>
        );
    }

    const width = 560;
    const height = 160;
    const padding = 24;
    const stepX =
        points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

    const toXY = (score: number, index: number) => {
        const x = padding + stepX * index;
        const y = height - padding - (score / 100) * (height - padding * 2);

        return [x, y] as const;
    };

    const linePath = points
        .map((point, index) => {
            const [x, y] = toXY(point.score, index);

            return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    const average = Math.round(
        points.reduce((sum, point) => sum + point.score, 0) / points.length,
    );

    return (
        <div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-40 w-full"
                preserveAspectRatio="none"
            >
                {[0, 25, 50, 75, 100].map((mark) => {
                    const y =
                        height -
                        padding -
                        (mark / 100) * (height - padding * 2);

                    return (
                        <line
                            key={mark}
                            x1={padding}
                            x2={width - padding}
                            y1={y}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeWidth={1}
                        />
                    );
                })}

                <path
                    d={linePath}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={2.5}
                />

                {points.map((point, index) => {
                    const [x, y] = toXY(point.score, index);

                    return (
                        <circle
                            key={`${point.label}-${point.date}`}
                            cx={x}
                            cy={y}
                            r={4}
                            fill="#b91c1c"
                        >
                            <title>{`${point.label}: ${point.score}%`}</title>
                        </circle>
                    );
                })}
            </svg>
            <p className="mt-2 text-sm text-slate-500">
                Average across last {points.length} quiz
                {points.length === 1 ? '' : 'zes'}:{' '}
                <span className="font-semibold text-slate-700">{average}%</span>
            </p>
        </div>
    );
}

export default function StudentDashboard({
    stats,
    prediction,
    performance_trend,
    pending_quizzes,
    recent_activity,
}: StudentDashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const firstName = auth.user.name.split(' ')[0];

    const statCards = [
        {
            title: 'Enrolled Subjects',
            value: stats.course_count,
            icon: BookOpen,
        },
        {
            title: 'Attendance Rate',
            value: formatPercent(stats.attendance_rate),
            icon: CalendarCheck,
        },
        {
            title: 'Study Time This Week',
            value: `${Math.floor(stats.study_minutes_this_week / 60)}h ${(stats.study_minutes_this_week % 60).toFixed(2)}m`,
            icon: Clock,
        },
        {
            title: 'Pending Quizzes',
            value: stats.pending_quiz_count,
            icon: ClipboardList,
        },
    ];

    const insights = prediction.flags.length
        ? prediction.flags.map((flag) => FLAG_MESSAGES[flag] ?? flag)
        : [
              "You're on track — keep attending classes and submitting quizzes on time.",
          ];

    return (
        <>
            <Head title="Student Dashboard" />

            <div className="min-h-full bg-red-50/30">
                <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6">
                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex gap-4">
                                <DashboardAvatar />
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-red-100">
                                        <LayoutDashboard className="size-4" />
                                        GRC LMS — Student Portal
                                    </div>
                                    <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                                        Welcome back, {firstName}
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100 md:text-base">
                                        Here's how you're doing across your
                                        subjects this week.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[420px]">
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
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Quiz Performance
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Your most recent quiz scores
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <TrendChart points={performance_trend} />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-slate-900">
                                        Predictive Analytics
                                    </h2>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${RISK_STYLES[prediction.risk_level]}`}
                                    >
                                        {prediction.risk_level} risk
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
                                    <SuccessGauge
                                        value={prediction.composite_score}
                                    />

                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Overall standing
                                                </p>
                                                <p className="font-semibold text-slate-900">
                                                    {prediction.label}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Attendance
                                                </p>
                                                <p className="font-semibold text-slate-900">
                                                    {formatPercent(
                                                        prediction.attendance_rate,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Academic average
                                                </p>
                                                <p className="font-semibold text-slate-900">
                                                    {formatPercent(
                                                        prediction.academic_average,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

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
                                    </div>
                                </div>
                            </div>

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
                        </div>

                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Upcoming
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Quizzes you haven't taken yet
                                        </p>
                                    </div>
                                    <Link
                                        href="/student/courses"
                                        className="text-sm font-semibold text-red-700 hover:text-red-800"
                                    >
                                        View
                                    </Link>
                                </div>

                                {pending_quizzes.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {pending_quizzes.map((quiz) => (
                                            <Link
                                                key={quiz.id}
                                                href={`/student/quizzes/${quiz.id}`}
                                                className="flex items-center justify-between gap-3 p-4 hover:bg-red-50/40"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-900">
                                                        {quiz.title}
                                                    </p>
                                                    <p className="truncate text-sm text-slate-600">
                                                        {quiz.course_subject}
                                                    </p>
                                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                                        <CalendarClock className="size-3.5" />
                                                        {formatDeadline(
                                                            quiz.deadline,
                                                        )}
                                                    </p>
                                                </div>
                                                <ClipboardList className="size-5 shrink-0 text-red-600" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                        <ClipboardList className="size-10 text-slate-300" />
                                        <h3 className="mt-3 font-semibold text-slate-700">
                                            No pending quizzes
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            You're all caught up.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="font-semibold text-slate-900">
                                    Quick Actions
                                </h2>
                                <div className="mt-4 space-y-2">
                                    <Link
                                        href="/student/courses"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <BookOpen className="size-4 text-red-700" />
                                        My Subjects
                                    </Link>
                                    <Link
                                        href="/student/attendance"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <CalendarCheck className="size-4 text-red-700" />
                                        Attendance
                                    </Link>
                                    <Link
                                        href="/student/grades"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <Award className="size-4 text-red-700" />
                                        My Grades
                                    </Link>
                                    <Link
                                        href="/student/feedback"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <MessageSquare className="size-4 text-red-700" />
                                        Feedback
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
