import { Form, Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Dices,
    GraduationCap,
    Pencil,
    Plus,
    Save,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dropQueryParam } from '@/lib/back-navigation';
import type { CurriculumSubject } from '@/lib/curriculum-options';
import { getCurriculumSubjectOptions } from '@/lib/curriculum-options';
import { generateRandomCode } from '@/lib/random-code';
import { getSectionOptions } from '@/lib/section-options';

const MANUAL_SUBJECT = '__manual__';

// Same palette and per-id selection as the student "My Subjects" cards
// (resources/js/pages/student/courses/index.tsx), so a subject looks
// consistent regardless of which role is viewing it — red/white brand
// family only, varying shade for visual distinction between cards.
const BANNER_GRADIENTS = [
    'from-red-700 to-red-500',
    'from-rose-700 to-rose-500',
    'from-red-900 to-red-700',
    'from-orange-700 to-red-600',
    'from-rose-800 to-red-600',
    'from-red-600 to-orange-500',
    'from-red-800 to-rose-600',
    'from-rose-600 to-orange-500',
];

function rollSubjectCode(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement | null;

    if (input) {
        input.value = generateRandomCode();
        input.focus();
    }
}

interface Course {
    id: number;
    subject: string;
    subject_code: string | null;
    professor_id: number | null;
    module_title: string;
    year_level: string | null;
    section: string | null;
    hyflex_group: string | null;
    today_hyflex_mode: 'f2f' | 'online' | null;
    department_id: number | null;
    academic_term_id: number | null;
    schedule_mode: 'single' | 'dual';
    class_day: string | null;
    class_start_time: string | null;
    class_end_time: string | null;
    class_day_2: string | null;
    class_start_time_2: string | null;
    class_end_time_2: string | null;
    enrollments_count: number;
    department?: {
        name: string;
    } | null;
}

interface PaginatedCourses {
    data: Course[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface AcademicTerm {
    id: number;
    name: string;
    semester: string | null;
    start_date: string;
    end_date: string;
}

interface Professor {
    id: number;
    name: string;
    department_id: number | null;
}

interface CoursesIndexProps {
    courses: PaginatedCourses;
    filters: {
        year_level: string;
        department_id: string;
    };
    year_levels: string[];
    class_days: string[];
    departments: Department[];
    academic_terms: AcademicTerm[];
    professors: Professor[];
    curriculum_subjects: CurriculumSubject[];
}

export default function ProfessorCoursesIndex({
    courses,
    filters,
    year_levels,
    class_days,
    departments,
    academic_terms,
    professors,
    curriculum_subjects,
}: CoursesIndexProps) {
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [departmentId, setDepartmentId] = useState(
        filters.department_id ?? '',
    );
    const [showCreateModal, setShowCreateModal] = useState(
        () => new URLSearchParams(window.location.search).get('create') === '1',
    );

    // Dismissing the modal has to drop `?create=1` too — otherwise coming
    // back to this exact URL later (browser Back/Forward, or a refresh)
    // reopens it even though the user already closed it once.
    const closeCreateModal = () => {
        setShowCreateModal(false);
        dropQueryParam('create');
    };
    const [formYearLevel, setFormYearLevel] = useState('');
    const [formDepartmentId, setFormDepartmentId] = useState('');
    const [formAcademicTermId, setFormAcademicTermId] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formSubjectManual, setFormSubjectManual] = useState('');
    const [formScheduleMode, setFormScheduleMode] = useState<'single' | 'dual'>(
        'single',
    );
    const sectionOptions = getSectionOptions(formYearLevel);
    const createSubjectOptions = getCurriculumSubjectOptions(
        curriculum_subjects,
        formDepartmentId,
        formYearLevel,
        formAcademicTermId,
        academic_terms,
    );
    const createSubjectFiltersReady =
        formYearLevel !== '' &&
        formAcademicTermId !== '' &&
        formDepartmentId !== '';

    const resetCreateForm = () => {
        setFormYearLevel('');
        setFormDepartmentId('');
        setFormAcademicTermId('');
        setFormSubject('');
        setFormSubjectManual('');
        setFormScheduleMode('single');
    };

    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editYearLevel, setEditYearLevel] = useState('');
    const [editDepartmentId, setEditDepartmentId] = useState('');
    const [editAcademicTermId, setEditAcademicTermId] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editSubjectManual, setEditSubjectManual] = useState('');
    const [editScheduleMode, setEditScheduleMode] = useState<'single' | 'dual'>(
        'single',
    );
    const editSectionOptions = getSectionOptions(editYearLevel);
    const editAvailableProfessors = editDepartmentId
        ? professors.filter(
              (professor) =>
                  professor.department_id === Number(editDepartmentId) ||
                  professor.id === editingCourse?.professor_id,
          )
        : professors;
    const editSubjectOptions = getCurriculumSubjectOptions(
        curriculum_subjects,
        editDepartmentId,
        editYearLevel,
        editAcademicTermId,
        academic_terms,
    );
    const editSubjectFiltersReady =
        editYearLevel !== '' &&
        editAcademicTermId !== '' &&
        editDepartmentId !== '';

    const openEditModal = (course: Course) => {
        setEditingCourse(course);
        setEditYearLevel(course.year_level ?? '');
        setEditScheduleMode(course.schedule_mode);
        setEditDepartmentId(
            course.department_id !== null ? String(course.department_id) : '',
        );
        setEditAcademicTermId(
            course.academic_term_id !== null
                ? String(course.academic_term_id)
                : '',
        );

        const initialOptions = getCurriculumSubjectOptions(
            curriculum_subjects,
            course.department_id !== null ? String(course.department_id) : '',
            course.year_level ?? '',
            course.academic_term_id !== null
                ? String(course.academic_term_id)
                : '',
            academic_terms,
        );

        if (initialOptions.some((option) => option.title === course.subject)) {
            setEditSubject(course.subject);
            setEditSubjectManual('');
        } else {
            setEditSubject(MANUAL_SUBJECT);
            setEditSubjectManual(course.subject);
        }
    };

    const applyFilters = (
        overrides: Partial<{
            year_level: string;
            department_id: string;
        }> = {},
    ) => {
        router.get(
            '/professor/courses',
            {
                year_level: yearLevel,
                department_id: departmentId,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setYearLevel('');
        setDepartmentId('');

        router.get(
            '/professor/courses',
            {},
            { preserveState: true, replace: true },
        );
    };

    const hasFilters = yearLevel || departmentId;

    return (
        <>
            <Head title="My Subjects" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <BookOpen className="size-4" />
                                    Subject Management
                                </div>

                                <h1 className="mt-2 text-2xl font-bold">
                                    My Subjects
                                </h1>

                                <p className="mt-2 text-sm text-red-100">
                                    Browse and filter the subjects you teach.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <Plus className="size-4" />
                                Add Subject
                            </button>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-5">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    All Subjects
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {courses.total} subject records
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={yearLevel}
                                    onChange={(event) => {
                                        setYearLevel(event.target.value);
                                        applyFilters({
                                            year_level: event.target.value,
                                        });
                                    }}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="">All Year Levels</option>
                                    {year_levels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={departmentId}
                                    onChange={(event) => {
                                        setDepartmentId(event.target.value);
                                        applyFilters({
                                            department_id: event.target.value,
                                        });
                                    }}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>

                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800"
                                    >
                                        <X className="size-3.5" />
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {courses.data.length > 0 ? (
                            <>
                                <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {courses.data.map((course) => (
                                        <div
                                            key={course.id}
                                            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            <div
                                                className={`relative bg-gradient-to-br p-4 pb-8 ${
                                                    BANNER_GRADIENTS[
                                                        course.id %
                                                            BANNER_GRADIENTS.length
                                                    ]
                                                }`}
                                            >
                                                <Link
                                                    href={`/professor/courses/${course.id}/content`}
                                                    className="line-clamp-2 pr-12 text-lg font-bold text-white hover:underline"
                                                >
                                                    {course.subject}
                                                </Link>
                                                <p className="mt-1 text-sm text-white/80">
                                                    Section{' '}
                                                    {course.section ??
                                                        'Unassigned'}
                                                </p>
                                                <div className="absolute right-4 -bottom-5 flex size-11 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-white bg-white text-red-700 shadow-sm">
                                                    <Users className="size-3.5" />
                                                    <span className="text-[10px] leading-none font-bold">
                                                        {
                                                            course.enrollments_count
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="px-4 pt-7 pb-4">
                                                <p className="truncate text-sm text-slate-600">
                                                    {course.module_title}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        {course.year_level ??
                                                            'Year level unassigned'}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        {course.department
                                                            ?.name ??
                                                            'Department unassigned'}
                                                    </span>
                                                    {course.today_hyflex_mode && (
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                                            </div>

                                            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
                                                <Link
                                                    href={`/professor/courses/${course.id}/roster`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                >
                                                    <Users className="size-3.5" />
                                                    Roster
                                                </Link>
                                                <Link
                                                    href={`/professor/courses/${course.id}/grades/prelims`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                >
                                                    <GraduationCap className="size-3.5" />
                                                    Grades
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(course)
                                                    }
                                                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                >
                                                    <Pencil className="size-3.5" />
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                    <p className="text-sm text-slate-500">
                                        Showing {courses.from ?? 0} to{' '}
                                        {courses.to ?? 0} of {courses.total}{' '}
                                        subjects
                                    </p>

                                    <div className="flex items-center gap-2">
                                        {courses.prev_page_url ? (
                                            <Link
                                                href={courses.prev_page_url}
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
                                            Page {courses.current_page} of{' '}
                                            {courses.last_page}
                                        </span>

                                        {courses.next_page_url ? (
                                            <Link
                                                href={courses.next_page_url}
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
                            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                                <h3 className="text-xl font-semibold text-slate-700">
                                    No subjects found
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    {hasFilters
                                        ? 'Try adjusting or clearing your filters.'
                                        : 'Create a new subject to see it listed here.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    <Plus className="size-4" /> Add Subject
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <Dialog
                open={showCreateModal}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateModal();
                    } else {
                        setShowCreateModal(true);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto p-0">
                    <div className="border-b border-slate-200 p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Plus className="size-5 text-red-600" />
                            Add Subject
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-slate-500">
                            Create a new subject under your name.
                        </DialogDescription>
                    </div>

                    <Form
                        action="/professor/courses"
                        method="post"
                        disableWhileProcessing
                        resetOnSuccess
                        onSuccess={() => {
                            closeCreateModal();
                            resetCreateForm();
                        }}
                        className="px-6 pb-6"
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="subject_code">
                                        Subject Code
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="subject_code"
                                            name="subject_code"
                                            autoComplete="off"
                                            placeholder="Code students use to search and enroll"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                rollSubjectCode('subject_code')
                                            }
                                            title="Generate random subject code"
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-red-600"
                                        >
                                            <Dices className="size-4" />
                                        </button>
                                    </div>
                                    <InputError message={errors.subject_code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="schedule_mode">
                                        Class Schedule
                                    </Label>
                                    <select
                                        id="schedule_mode"
                                        name="schedule_mode"
                                        value={formScheduleMode}
                                        onChange={(event) =>
                                            setFormScheduleMode(
                                                event.target.value as
                                                    'single' | 'dual',
                                            )
                                        }
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="single">
                                            One Class Schedule
                                        </option>
                                        <option value="dual">
                                            Two Class Schedules
                                        </option>
                                    </select>
                                    <InputError
                                        message={errors.schedule_mode}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>
                                        {formScheduleMode === 'dual'
                                            ? 'Face-to-Face and Synchronous Class'
                                            : 'Class Schedule'}
                                    </Label>

                                    <div className="grid grid-cols-3 gap-4 rounded-md border border-input p-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="class_day">
                                                Day
                                            </Label>
                                            <select
                                                id="class_day"
                                                name="class_day"
                                                defaultValue=""
                                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                            >
                                                <option value="">
                                                    Select day
                                                </option>
                                                {class_days.map((day) => (
                                                    <option
                                                        key={day}
                                                        value={day}
                                                    >
                                                        {day}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="class_start_time">
                                                Start Time
                                            </Label>
                                            <Input
                                                id="class_start_time"
                                                name="class_start_time"
                                                type="time"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="class_end_time">
                                                End Time
                                            </Label>
                                            <Input
                                                id="class_end_time"
                                                name="class_end_time"
                                                type="time"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Students can only join the live class
                                        within this time window.
                                    </p>

                                    <InputError message={errors.class_day} />
                                    <InputError
                                        message={errors.class_start_time}
                                    />
                                    <InputError
                                        message={errors.class_end_time}
                                    />
                                </div>

                                {formScheduleMode === 'dual' && (
                                    <div className="grid gap-2">
                                        <Label>Asynchronous Class</Label>

                                        <div className="grid grid-cols-3 gap-4 rounded-md border border-input p-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="class_day_2">
                                                    Day
                                                </Label>
                                                <select
                                                    id="class_day_2"
                                                    name="class_day_2"
                                                    defaultValue=""
                                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                                >
                                                    <option value="">
                                                        Select day
                                                    </option>
                                                    {class_days.map((day) => (
                                                        <option
                                                            key={day}
                                                            value={day}
                                                        >
                                                            {day}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="class_start_time_2">
                                                    Start Time
                                                </Label>
                                                <Input
                                                    id="class_start_time_2"
                                                    name="class_start_time_2"
                                                    type="time"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="class_end_time_2">
                                                    End Time
                                                </Label>
                                                <Input
                                                    id="class_end_time_2"
                                                    name="class_end_time_2"
                                                    type="time"
                                                />
                                            </div>
                                        </div>

                                        <InputError
                                            message={errors.class_day_2}
                                        />
                                        <InputError
                                            message={errors.class_start_time_2}
                                        />
                                        <InputError
                                            message={errors.class_end_time_2}
                                        />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="hyflex_group">
                                        HyFlex Group
                                    </Label>
                                    <select
                                        id="hyflex_group"
                                        name="hyflex_group"
                                        defaultValue="A"
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="A">HyFlex A</option>
                                        <option value="B">HyFlex B</option>
                                    </select>
                                    <p className="text-xs text-slate-500">
                                        Which HyFlex cohort this subject follows
                                        for its face-to-face / online week
                                        rotation.
                                    </p>
                                    <InputError message={errors.hyflex_group} />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="year_level">
                                            Year Level
                                        </Label>
                                        <select
                                            id="year_level"
                                            name="year_level"
                                            value={formYearLevel}
                                            onChange={(event) => {
                                                setFormYearLevel(
                                                    event.target.value,
                                                );
                                                setFormSubject('');
                                            }}
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
                                                Select year level
                                            </option>
                                            {year_levels.map((level) => (
                                                <option
                                                    key={level}
                                                    value={level}
                                                >
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.year_level}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="section">Section</Label>
                                        <select
                                            key={formYearLevel}
                                            id="section"
                                            name="section"
                                            disabled={
                                                sectionOptions.length === 0
                                            }
                                            defaultValue=""
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                {sectionOptions.length === 0
                                                    ? 'Select year level first'
                                                    : 'Select section'}
                                            </option>
                                            {sectionOptions.map((value) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.section} />
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="department_id">
                                            Department
                                        </Label>
                                        <select
                                            id="department_id"
                                            name="department_id"
                                            value={formDepartmentId}
                                            onChange={(event) => {
                                                setFormDepartmentId(
                                                    event.target.value,
                                                );
                                                setFormSubject('');
                                            }}
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
                                                Select department
                                            </option>
                                            {departments.map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.department_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="academic_term_id">
                                            Academic Term
                                        </Label>
                                        <select
                                            id="academic_term_id"
                                            name="academic_term_id"
                                            value={formAcademicTermId}
                                            onChange={(event) => {
                                                setFormAcademicTermId(
                                                    event.target.value,
                                                );
                                                setFormSubject('');
                                            }}
                                            required
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="" disabled>
                                                Select term
                                            </option>
                                            {academic_terms.map((term) => (
                                                <option
                                                    key={term.id}
                                                    value={term.id}
                                                >
                                                    {term.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.academic_term_id}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="subject">
                                        Subject Title
                                    </Label>
                                    <select
                                        id="subject"
                                        name={
                                            formSubject === MANUAL_SUBJECT
                                                ? undefined
                                                : 'subject'
                                        }
                                        disabled={!createSubjectFiltersReady}
                                        value={formSubject}
                                        onChange={(event) =>
                                            setFormSubject(event.target.value)
                                        }
                                        required
                                        className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>
                                            {createSubjectFiltersReady
                                                ? 'Select subject title'
                                                : 'Select year level, academic term, and department first'}
                                        </option>
                                        {createSubjectOptions
                                            .filter(
                                                (option) =>
                                                    option.category ===
                                                    'regular',
                                            )
                                            .map((option) => (
                                                <option
                                                    key={option.id}
                                                    value={option.title}
                                                >
                                                    {option.code} —{' '}
                                                    {option.title}
                                                </option>
                                            ))}
                                        {createSubjectOptions.some(
                                            (option) =>
                                                option.category === 'bridging',
                                        ) && (
                                            <optgroup label="Bridging Course">
                                                {createSubjectOptions
                                                    .filter(
                                                        (option) =>
                                                            option.category ===
                                                            'bridging',
                                                    )
                                                    .map((option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.title}
                                                        >
                                                            {option.code} —{' '}
                                                            {option.title}
                                                        </option>
                                                    ))}
                                            </optgroup>
                                        )}
                                        {createSubjectOptions.some(
                                            (option) =>
                                                option.category === 'elective',
                                        ) && (
                                            <optgroup label="Professional Electives">
                                                {createSubjectOptions
                                                    .filter(
                                                        (option) =>
                                                            option.category ===
                                                            'elective',
                                                    )
                                                    .map((option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.title}
                                                        >
                                                            {option.code} —{' '}
                                                            {option.title}
                                                        </option>
                                                    ))}
                                            </optgroup>
                                        )}
                                        <option value={MANUAL_SUBJECT}>
                                            Other (type manually)
                                        </option>
                                    </select>
                                    {formSubject === MANUAL_SUBJECT && (
                                        <Input
                                            name="subject"
                                            value={formSubjectManual}
                                            onChange={(event) =>
                                                setFormSubjectManual(
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            autoFocus
                                            placeholder="Enter subject title"
                                            className="mt-1.5"
                                        />
                                    )}
                                    <InputError message={errors.subject} />
                                </div>

                                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={closeCreateModal}
                                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <Save className="size-4" />
                                        {processing
                                            ? 'Saving...'
                                            : 'Create Subject'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editingCourse !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingCourse(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto p-0">
                    <div className="border-b border-slate-200 p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Pencil className="size-5 text-red-600" />
                            Edit Subject
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-slate-500">
                            Update the section or hand this subject off to a
                            colleague in your department.
                        </DialogDescription>
                    </div>

                    {editingCourse && (
                        <Form
                            key={editingCourse.id}
                            action={`/professor/courses/${editingCourse.id}`}
                            method="put"
                            disableWhileProcessing
                            onSuccess={() => setEditingCourse(null)}
                            className="px-6 pb-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_subject_code">
                                            Subject Code
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="edit_subject_code"
                                                name="subject_code"
                                                autoComplete="off"
                                                defaultValue={
                                                    editingCourse.subject_code ??
                                                    ''
                                                }
                                                placeholder="Code students use to search and enroll"
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    rollSubjectCode(
                                                        'edit_subject_code',
                                                    )
                                                }
                                                title="Generate random subject code"
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-red-600"
                                            >
                                                <Dices className="size-4" />
                                            </button>
                                        </div>
                                        <InputError
                                            message={errors.subject_code}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_department_id">
                                            Department
                                        </Label>
                                        <select
                                            id="edit_department_id"
                                            name="department_id"
                                            value={editDepartmentId}
                                            onChange={(event) => {
                                                setEditDepartmentId(
                                                    event.target.value,
                                                );
                                                setEditSubject('');
                                            }}
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
                                                Select department
                                            </option>
                                            {departments.map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.department_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_professor_id">
                                            Assigned Professor
                                        </Label>
                                        <select
                                            key={editDepartmentId}
                                            id="edit_professor_id"
                                            name="professor_id"
                                            defaultValue={
                                                editingCourse.professor_id ?? ''
                                            }
                                            required
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="" disabled>
                                                Select professor account
                                            </option>
                                            {editAvailableProfessors.map(
                                                (professor) => (
                                                    <option
                                                        key={professor.id}
                                                        value={professor.id}
                                                    >
                                                        {professor.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        {editDepartmentId &&
                                            editAvailableProfessors.length ===
                                                0 && (
                                                <p className="text-xs text-amber-600">
                                                    No professors belong to this
                                                    department yet.
                                                </p>
                                            )}
                                        <InputError
                                            message={errors.professor_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_schedule_mode">
                                            Class Schedule
                                        </Label>
                                        <select
                                            id="edit_schedule_mode"
                                            name="schedule_mode"
                                            value={editScheduleMode}
                                            onChange={(event) =>
                                                setEditScheduleMode(
                                                    event.target.value as
                                                        'single' | 'dual',
                                                )
                                            }
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="single">
                                                One Class Schedule
                                            </option>
                                            <option value="dual">
                                                Two Class Schedules
                                            </option>
                                        </select>
                                        <InputError
                                            message={errors.schedule_mode}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>
                                            {editScheduleMode === 'dual'
                                                ? 'Face-to-Face and Synchronous Class'
                                                : 'Class Schedule'}
                                        </Label>

                                        <div className="grid grid-cols-3 gap-4 rounded-md border border-input p-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit_class_day">
                                                    Day
                                                </Label>
                                                <select
                                                    id="edit_class_day"
                                                    name="class_day"
                                                    defaultValue={
                                                        editingCourse.class_day ??
                                                        ''
                                                    }
                                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                                >
                                                    <option value="">
                                                        Select day
                                                    </option>
                                                    {class_days.map((day) => (
                                                        <option
                                                            key={day}
                                                            value={day}
                                                        >
                                                            {day}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="edit_class_start_time">
                                                    Start Time
                                                </Label>
                                                <Input
                                                    id="edit_class_start_time"
                                                    name="class_start_time"
                                                    type="time"
                                                    defaultValue={
                                                        editingCourse.class_start_time ??
                                                        ''
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="edit_class_end_time">
                                                    End Time
                                                </Label>
                                                <Input
                                                    id="edit_class_end_time"
                                                    name="class_end_time"
                                                    type="time"
                                                    defaultValue={
                                                        editingCourse.class_end_time ??
                                                        ''
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500">
                                            Students can only join the live
                                            class within this time window.
                                        </p>

                                        <InputError
                                            message={errors.class_day}
                                        />
                                        <InputError
                                            message={errors.class_start_time}
                                        />
                                        <InputError
                                            message={errors.class_end_time}
                                        />
                                    </div>

                                    {editScheduleMode === 'dual' && (
                                        <div className="grid gap-2">
                                            <Label>Asynchronous Class</Label>

                                            <div className="grid grid-cols-3 gap-4 rounded-md border border-input p-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit_class_day_2">
                                                        Day
                                                    </Label>
                                                    <select
                                                        id="edit_class_day_2"
                                                        name="class_day_2"
                                                        defaultValue={
                                                            editingCourse.class_day_2 ??
                                                            ''
                                                        }
                                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                                    >
                                                        <option value="">
                                                            Select day
                                                        </option>
                                                        {class_days.map(
                                                            (day) => (
                                                                <option
                                                                    key={day}
                                                                    value={day}
                                                                >
                                                                    {day}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit_class_start_time_2">
                                                        Start Time
                                                    </Label>
                                                    <Input
                                                        id="edit_class_start_time_2"
                                                        name="class_start_time_2"
                                                        type="time"
                                                        defaultValue={
                                                            editingCourse.class_start_time_2 ??
                                                            ''
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit_class_end_time_2">
                                                        End Time
                                                    </Label>
                                                    <Input
                                                        id="edit_class_end_time_2"
                                                        name="class_end_time_2"
                                                        type="time"
                                                        defaultValue={
                                                            editingCourse.class_end_time_2 ??
                                                            ''
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <InputError
                                                message={errors.class_day_2}
                                            />
                                            <InputError
                                                message={
                                                    errors.class_start_time_2
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.class_end_time_2
                                                }
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_hyflex_group">
                                            HyFlex Group
                                        </Label>
                                        <select
                                            id="edit_hyflex_group"
                                            name="hyflex_group"
                                            defaultValue={
                                                editingCourse.hyflex_group ?? ''
                                            }
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">None</option>
                                            <option value="A">HyFlex A</option>
                                            <option value="B">HyFlex B</option>
                                        </select>
                                        <p className="text-xs text-slate-500">
                                            Which HyFlex cohort this subject
                                            follows for its face-to-face /
                                            online week rotation.
                                        </p>
                                        <InputError
                                            message={errors.hyflex_group}
                                        />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_year_level">
                                                Year Level
                                            </Label>
                                            <select
                                                id="edit_year_level"
                                                name="year_level"
                                                value={editYearLevel}
                                                onChange={(event) => {
                                                    setEditYearLevel(
                                                        event.target.value,
                                                    );
                                                    setEditSubject('');
                                                }}
                                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                            >
                                                <option value="">
                                                    Select year level
                                                </option>
                                                {year_levels.map((level) => (
                                                    <option
                                                        key={level}
                                                        value={level}
                                                    >
                                                        {level}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.year_level}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_section">
                                                Section
                                            </Label>
                                            <select
                                                key={editYearLevel}
                                                id="edit_section"
                                                name="section"
                                                disabled={
                                                    editSectionOptions.length ===
                                                    0
                                                }
                                                defaultValue={
                                                    editYearLevel ===
                                                    (editingCourse.year_level ??
                                                        '')
                                                        ? (editingCourse.section ??
                                                          '')
                                                        : ''
                                                }
                                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="" disabled>
                                                    {editSectionOptions.length ===
                                                    0
                                                        ? 'Select year level first'
                                                        : 'Select section'}
                                                </option>
                                                {editSectionOptions.map(
                                                    (value) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {value}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={errors.section}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_academic_term_id">
                                            Academic Term
                                        </Label>
                                        <select
                                            id="edit_academic_term_id"
                                            name="academic_term_id"
                                            value={editAcademicTermId}
                                            onChange={(event) => {
                                                setEditAcademicTermId(
                                                    event.target.value,
                                                );
                                                setEditSubject('');
                                            }}
                                            required
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="" disabled>
                                                Select term
                                            </option>
                                            {academic_terms.map((term) => (
                                                <option
                                                    key={term.id}
                                                    value={term.id}
                                                >
                                                    {term.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.academic_term_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_subject">
                                            Subject Title
                                        </Label>
                                        <select
                                            id="edit_subject"
                                            name={
                                                editSubject === MANUAL_SUBJECT
                                                    ? undefined
                                                    : 'subject'
                                            }
                                            disabled={!editSubjectFiltersReady}
                                            value={editSubject}
                                            onChange={(event) =>
                                                setEditSubject(
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                {editSubjectFiltersReady
                                                    ? 'Select subject title'
                                                    : 'Select year level, academic term, and department first'}
                                            </option>
                                            {editSubjectOptions
                                                .filter(
                                                    (option) =>
                                                        option.category ===
                                                        'regular',
                                                )
                                                .map((option) => (
                                                    <option
                                                        key={option.id}
                                                        value={option.title}
                                                    >
                                                        {option.code} —{' '}
                                                        {option.title}
                                                    </option>
                                                ))}
                                            {editSubjectOptions.some(
                                                (option) =>
                                                    option.category ===
                                                    'bridging',
                                            ) && (
                                                <optgroup label="Bridging Course">
                                                    {editSubjectOptions
                                                        .filter(
                                                            (option) =>
                                                                option.category ===
                                                                'bridging',
                                                        )
                                                        .map((option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.title
                                                                }
                                                            >
                                                                {option.code} —{' '}
                                                                {option.title}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            )}
                                            {editSubjectOptions.some(
                                                (option) =>
                                                    option.category ===
                                                    'elective',
                                            ) && (
                                                <optgroup label="Professional Electives">
                                                    {editSubjectOptions
                                                        .filter(
                                                            (option) =>
                                                                option.category ===
                                                                'elective',
                                                        )
                                                        .map((option) => (
                                                            <option
                                                                key={option.id}
                                                                value={
                                                                    option.title
                                                                }
                                                            >
                                                                {option.code} —{' '}
                                                                {option.title}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            )}
                                            <option value={MANUAL_SUBJECT}>
                                                Other (type manually)
                                            </option>
                                        </select>
                                        {editSubject === MANUAL_SUBJECT && (
                                            <Input
                                                name="subject"
                                                value={editSubjectManual}
                                                onChange={(event) =>
                                                    setEditSubjectManual(
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                autoFocus
                                                placeholder="Enter subject title"
                                                className="mt-1.5"
                                            />
                                        )}
                                        <InputError message={errors.subject} />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingCourse(null)
                                            }
                                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                        >
                                            <Save className="size-4" />
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
