import { Head, Link } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    ClipboardList,
    GraduationCap,
    Pencil,
    Plus,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import BibleVerseCard from '@/components/bible-verse-card';
import DashboardAvatar from '@/components/dashboard-avatar';
import ScoreBar from '@/components/score-bar';
import SuccessGauge from '@/components/success-gauge';

interface DashboardStats {
    total_students: number;
    total_professors: number;
    total_courses: number;
    students_at_risk_percentage: number;
    current_term: string | null;
}

interface Institution {
    average_composite_score: number | null;
    risk_counts: { low: number; medium: number; high: number };
    flag_counts: {
        low_attendance: number;
        low_academic_performance: number;
        incomplete_profile: number;
    };
    pending_grading_count: number;
}

interface NeedsAttentionStudent {
    id: number;
    name: string;
    composite_score: number;
    label: string;
    risk_level: 'low' | 'medium' | 'high';
}

interface ActivityEntry {
    type: 'student' | 'course' | 'grade';
    title: string;
    meta: string | null;
    at: string;
}

interface Student {
    id: number;
    name: string;
    student_id: string | null;
    email: string;
    year_level: string | null;
    section: string | null;
}

interface RecentCourse {
    id: number;
    subject: string;
    professor: string | null;
    module_title: string | null;
    created_at: string;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    institution: Institution;
    needs_attention: NeedsAttentionStudent[];
    recent_activity: ActivityEntry[];
    students: Student[];
    recent_courses: RecentCourse[];
}

const RISK_STYLES: Record<NeedsAttentionStudent['risk_level'], string> = {
    low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    high: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const ACTIVITY_ICONS: Record<ActivityEntry['type'], typeof Users> = {
    student: UserPlus,
    course: BookOpen,
    grade: Award,
};

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
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

export default function AdminDashboard({
    stats,
    institution,
    needs_attention,
    recent_activity,
    students,
    recent_courses,
}: AdminDashboardProps) {
    const statCards = [
        {
            title: 'Total Students',
            value: stats.total_students,
            description: 'Registered student accounts',
            icon: Users,
        },
        {
            title: 'Professors',
            value: stats.total_professors,
            description: 'Registered professor accounts',
            icon: ShieldCheck,
        },
        {
            title: 'Total Subjects',
            value: stats.total_courses,
            description: 'Available LMS subjects',
            icon: BookOpen,
        },
        {
            title: 'At-risk Students',
            value: stats.students_at_risk_percentage + '%',
            description: 'Students missing core profile data',
            icon: ClipboardList,
        },
    ];

    const insights = [
        institution.flag_counts.low_attendance > 0 &&
            `${institution.flag_counts.low_attendance} student${institution.flag_counts.low_attendance === 1 ? '' : 's'} flagged for low attendance.`,
        institution.flag_counts.low_academic_performance > 0 &&
            `${institution.flag_counts.low_academic_performance} student${institution.flag_counts.low_academic_performance === 1 ? '' : 's'} flagged for low academic performance.`,
        institution.flag_counts.incomplete_profile > 0 &&
            `${institution.flag_counts.incomplete_profile} student${institution.flag_counts.incomplete_profile === 1 ? '' : 's'} have an incomplete profile.`,
        institution.pending_grading_count > 0 &&
            `${institution.pending_grading_count} submission${institution.pending_grading_count === 1 ? '' : 's'} awaiting grading.`,
    ].filter((insight): insight is string => Boolean(insight));

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="min-h-full bg-slate-50">
                <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-4 md:px-6 md:pb-6">
                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="flex gap-4">
                                <DashboardAvatar />
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-red-100">
                                        <ShieldCheck className="size-4" />
                                        GRC LMS Administration
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                        Admin Dashboard
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100 md:text-base">
                                        Manage students, subjects, and monitor
                                        institution-wide performance.
                                    </p>

                                    {stats.current_term && (
                                        <p className="mt-4 text-sm text-red-100">
                                            Current academic term:{' '}
                                            {stats.current_term}
                                        </p>
                                    )}
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

                                    <p className="mt-4 text-xs text-slate-500">
                                        {card.description}
                                    </p>
                                </div>
                            );
                        })}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-slate-900">
                                    Institution Performance
                                </h2>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {stats.total_students} students tracked
                                </span>
                            </div>

                            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
                                {institution.average_composite_score !==
                                null ? (
                                    <SuccessGauge
                                        value={
                                            institution.average_composite_score
                                        }
                                        label="avg. success score"
                                    />
                                ) : (
                                    <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-slate-50 text-center text-xs text-slate-400">
                                        No data yet
                                    </div>
                                )}

                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Low risk
                                            </p>
                                            <p className="font-semibold text-emerald-600">
                                                {institution.risk_counts.low}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Medium risk
                                            </p>
                                            <p className="font-semibold text-amber-600">
                                                {institution.risk_counts.medium}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                High risk
                                            </p>
                                            <p className="font-semibold text-red-600">
                                                {institution.risk_counts.high}
                                            </p>
                                        </div>
                                    </div>

                                    {insights.length > 0 ? (
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
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No risk flags across the student
                                            body right now.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Needs Attention
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Lowest-scoring students
                                    </p>
                                </div>
                                <Link
                                    href="/admin/performance/students"
                                    className="text-sm font-semibold text-red-700 hover:text-red-800"
                                >
                                    View
                                </Link>
                            </div>

                            {needs_attention.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {needs_attention.map((student) => (
                                        <Link
                                            key={student.id}
                                            href={`/admin/performance/students/${student.id}`}
                                            className="flex items-center justify-between gap-3 p-4 hover:bg-red-50/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {student.name}
                                                </p>
                                                <ScoreBar
                                                    value={
                                                        student.composite_score
                                                    }
                                                />
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${RISK_STYLES[student.risk_level]}`}
                                            >
                                                {student.risk_level}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                    <TrendingUp className="size-10 text-slate-300" />
                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No students yet
                                    </h3>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Students
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Manage registered student accounts
                                    </p>
                                </div>

                                <Link
                                    href="/admin/students"
                                    className="text-sm font-semibold text-red-700 hover:text-red-800"
                                >
                                    View all students
                                </Link>
                            </div>

                            {students.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[850px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">
                                                    Name
                                                </th>

                                                <th className="px-5 py-3 font-semibold">
                                                    Section
                                                </th>

                                                <th className="px-5 py-3 font-semibold">
                                                    Year Level
                                                </th>

                                                <th className="px-5 py-3 text-right font-semibold">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {students.map((student) => (
                                                <tr
                                                    key={student.id}
                                                    className="transition hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                                                                {student.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {student.student_id ??
                                                                        student.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {student.section ??
                                                            'Not assigned'}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {student.year_level ??
                                                            'Not assigned'}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Link
                                                            href={`/admin/students/${student.id}/edit`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                                    <GraduationCap className="size-10 text-slate-300" />

                                    <h3 className="mt-3 font-semibold text-slate-700">
                                        No students yet
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Student accounts will appear here.
                                    </p>

                                    <Link
                                        href="/admin/students/create"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        <UserPlus className="size-4" />
                                        Add Student
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Recent Subjects
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Latest subject records
                                        </p>
                                    </div>

                                    <Link
                                        href="/admin/courses"
                                        className="text-sm font-semibold text-red-700 hover:text-red-800"
                                    >
                                        View all
                                    </Link>
                                </div>

                                {recent_courses.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {recent_courses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="p-4 transition hover:bg-red-50/40"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-xl bg-red-100 p-2.5 text-red-700">
                                                        <BookOpen className="size-4" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate font-semibold text-slate-900">
                                                            {course.subject}
                                                        </h3>

                                                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                                            <span>
                                                                {course.professor ??
                                                                    'Not assigned'}
                                                            </span>

                                                            <span>
                                                                {formatDate(
                                                                    course.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                                        <BookOpen className="size-10 text-slate-300" />

                                        <h3 className="mt-3 font-semibold text-slate-700">
                                            No subjects yet
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
                                        href="/admin/students/create"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <UserPlus className="size-4 text-red-700" />
                                        Add Student
                                    </Link>
                                    <Link
                                        href="/admin/professors/create"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <GraduationCap className="size-4 text-red-700" />
                                        Add Professor
                                    </Link>
                                    <Link
                                        href="/admin/courses?create=1"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <Plus className="size-4 text-red-700" />
                                        Add Subject
                                    </Link>
                                    <Link
                                        href="/admin/grading"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                                    >
                                        <ClipboardList className="size-4 text-red-700" />
                                        Grading Oversight
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                Recent Activity
                            </h2>
                        </div>

                        {recent_activity.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {recent_activity.map((entry, index) => {
                                    const Icon = ACTIVITY_ICONS[entry.type];

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
                                                    {entry.meta
                                                        ? `${entry.meta} · `
                                                        : ''}
                                                    {formatRelative(entry.at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex min-h-40 flex-col items-center justify-center text-center">
                                <TrendingUp className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No activity yet
                                </h3>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
