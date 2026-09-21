import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Dices,
    Pencil,
    Plus,
    Save,
    Search,
    UploadCloud,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
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
import { generateRandomCode } from '@/lib/random-code';
import { getSectionOptions } from '@/lib/section-options';

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
    course_code: string | null;
    subject_code: string | null;
    professor: string;
    professor_id: number | null;
    module_title: string;
    year_level: string | null;
    section: string | null;
    hyflex_group: string | null;
    today_hyflex_mode: 'f2f' | 'online' | null;
    department_id: number | null;
    academic_term_id: number | null;
    class_day: string | null;
    class_start_time: string | null;
    class_end_time: string | null;
    enrollments_count: number;
    department?: {
        name: string;
    } | null;
    academic_term?: {
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
}

interface AcademicTerm {
    id: number;
    name: string;
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
        search: string;
        year_level: string;
        department_id: string;
    };
    year_levels: string[];
    class_days: string[];
    departments: Department[];
    academic_terms: AcademicTerm[];
    professors: Professor[];
}

export default function CoursesIndex({
    courses,
    filters,
    year_levels,
    class_days,
    departments,
    academic_terms,
    professors,
}: CoursesIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [departmentId, setDepartmentId] = useState(
        filters.department_id ?? '',
    );
    const [showCreateModal, setShowCreateModal] = useState(
        () => new URLSearchParams(window.location.search).get('create') === '1',
    );
    const [formYearLevel, setFormYearLevel] = useState('');
    const [formDepartmentId, setFormDepartmentId] = useState('');
    const sectionOptions = getSectionOptions(formYearLevel);
    const availableProfessors = formDepartmentId
        ? professors.filter(
              (professor) =>
                  professor.department_id === Number(formDepartmentId),
          )
        : professors;

    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editYearLevel, setEditYearLevel] = useState('');
    const [editDepartmentId, setEditDepartmentId] = useState('');
    const editSectionOptions = getSectionOptions(editYearLevel);
    const editAvailableProfessors = editDepartmentId
        ? professors.filter(
              (professor) =>
                  professor.department_id === Number(editDepartmentId) ||
                  professor.id === editingCourse?.professor_id,
          )
        : professors;

    const openEditModal = (course: Course) => {
        setEditingCourse(course);
        setEditYearLevel(course.year_level ?? '');
        setEditDepartmentId(
            course.department_id !== null ? String(course.department_id) : '',
        );
    };

    const applyFilters = (
        overrides: Partial<{
            search: string;
            year_level: string;
            department_id: string;
        }> = {},
    ) => {
        router.get(
            '/admin/courses',
            {
                search,
                year_level: yearLevel,
                department_id: departmentId,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters();
    };

    const clearSearch = () => {
        setSearch('');
        setYearLevel('');
        setDepartmentId('');

        router.get(
            '/admin/courses',
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Subjects" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <Plus className="size-4" />
                                    Subject Management
                                </div>

                                <h1 className="mt-2 text-2xl font-bold">
                                    Subjects
                                </h1>

                                <p className="mt-2 text-sm text-red-100">
                                    Manage LMS subject offerings, department and
                                    term assignments.
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
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        All Subjects
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {courses.total} subject records
                                    </p>
                                </div>

                                <form
                                    onSubmit={submitSearch}
                                    className="flex w-full gap-2 md:max-w-md"
                                >
                                    <div className="relative flex-1">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search by subject title..."
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-red-600"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        Search
                                    </button>
                                </form>
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

                                {(search || yearLevel || departmentId) && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
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
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px] text-left">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    Subject
                                                </th>
                                                <th className="px-5 py-3">
                                                    Professor
                                                </th>
                                                <th className="px-5 py-3">
                                                    Year Level
                                                </th>
                                                <th className="px-5 py-3">
                                                    Department
                                                </th>
                                                <th className="px-5 py-3">
                                                    Term
                                                </th>
                                                <th className="px-5 py-3">
                                                    Enrolled
                                                </th>
                                                <th className="px-5 py-3 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {courses.data.map((course) => (
                                                <tr
                                                    key={course.id}
                                                    className="hover:bg-red-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="font-medium text-slate-900">
                                                            {course.subject}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            ID:{' '}
                                                            {course.course_code ??
                                                                'None'}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Code:{' '}
                                                            {course.subject_code ??
                                                                'None'}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            {
                                                                course.module_title
                                                            }
                                                        </div>
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
                                                                    : 'Online'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {course.professor}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {course.year_level ??
                                                            'Unassigned'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {course.department
                                                            ?.name ??
                                                            'Unassigned'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {course.academic_term
                                                            ?.name ??
                                                            'Unassigned'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                            <Users className="size-3.5" />
                                                            {
                                                                course.enrollments_count
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="inline-flex gap-2">
                                                            <Link
                                                                href={`/admin/courses/${course.id}/content`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                            >
                                                                <UploadCloud className="size-4" />
                                                                Content
                                                            </Link>
                                                            <Link
                                                                href={`/admin/courses/${course.id}/enrollments`}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                            >
                                                                <Users className="size-4" />
                                                                Enrollment
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        course,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
                                    Create a new subject to see it listed here.
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

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto p-0">
                    <div className="border-b border-slate-200 p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Plus className="size-5 text-red-600" />
                            Add Subject
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-slate-500">
                            Create a new LMS subject record.
                        </DialogDescription>
                    </div>

                    <Form
                        action="/admin/courses"
                        method="post"
                        disableWhileProcessing
                        resetOnSuccess
                        onSuccess={() => {
                            setShowCreateModal(false);
                            setFormYearLevel('');
                            setFormDepartmentId('');
                        }}
                        className="px-6 pb-6"
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="subject">
                                        Subject Title
                                    </Label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        required
                                        autoFocus
                                        placeholder="Enter subject title"
                                    />
                                    <InputError message={errors.subject} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="course_code">
                                        Subject ID
                                    </Label>
                                    <Input
                                        id="course_code"
                                        name="course_code"
                                        placeholder="Optional subject ID"
                                    />
                                    <InputError message={errors.course_code} />
                                </div>

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
                                    <Label htmlFor="department_id">
                                        Department
                                    </Label>
                                    <select
                                        id="department_id"
                                        name="department_id"
                                        value={formDepartmentId}
                                        onChange={(event) =>
                                            setFormDepartmentId(
                                                event.target.value,
                                            )
                                        }
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
                                    <Label htmlFor="professor_id">
                                        Assign Professor Account
                                    </Label>
                                    <select
                                        key={formDepartmentId}
                                        id="professor_id"
                                        name="professor_id"
                                        required
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="">
                                            Select professor account
                                        </option>
                                        {availableProfessors.map(
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
                                    {formDepartmentId &&
                                        availableProfessors.length === 0 && (
                                            <p className="text-xs text-amber-600">
                                                No professors belong to this
                                                department yet.
                                            </p>
                                        )}
                                    <InputError message={errors.professor_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Class Schedule</Label>

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

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="year_level">
                                            Year Level
                                        </Label>
                                        <select
                                            id="year_level"
                                            name="year_level"
                                            value={formYearLevel}
                                            onChange={(event) =>
                                                setFormYearLevel(
                                                    event.target.value,
                                                )
                                            }
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

                                <div className="grid gap-2">
                                    <Label htmlFor="academic_term_id">
                                        Academic Term
                                    </Label>
                                    <select
                                        id="academic_term_id"
                                        name="academic_term_id"
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="">Select term</option>
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
                                    <Label htmlFor="hyflex_group">
                                        HyFlex Group
                                    </Label>
                                    <select
                                        id="hyflex_group"
                                        name="hyflex_group"
                                        defaultValue=""
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="">None</option>
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

                                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCreateModal(false)
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
                            Update this subject's details and assignment.
                        </DialogDescription>
                    </div>

                    {editingCourse && (
                        <Form
                            key={editingCourse.id}
                            action={`/admin/courses/${editingCourse.id}`}
                            method="put"
                            disableWhileProcessing
                            onSuccess={() => setEditingCourse(null)}
                            className="px-6 pb-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_subject">
                                            Subject Title
                                        </Label>
                                        <Input
                                            id="edit_subject"
                                            name="subject"
                                            defaultValue={editingCourse.subject}
                                            required
                                            autoFocus
                                        />
                                        <InputError message={errors.subject} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_course_code">
                                            Subject ID
                                        </Label>
                                        <Input
                                            id="edit_course_code"
                                            name="course_code"
                                            defaultValue={
                                                editingCourse.course_code ?? ''
                                            }
                                        />
                                        <InputError
                                            message={errors.course_code}
                                        />
                                    </div>

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
                                            onChange={(event) =>
                                                setEditDepartmentId(
                                                    event.target.value,
                                                )
                                            }
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
                                            Assign Professor Account
                                        </Label>
                                        <select
                                            key={editDepartmentId}
                                            id="edit_professor_id"
                                            name="professor_id"
                                            required
                                            defaultValue={
                                                editingCourse.professor_id ?? ''
                                            }
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
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
                                        <Label>Class Schedule</Label>

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

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_year_level">
                                                Year Level
                                            </Label>
                                            <select
                                                id="edit_year_level"
                                                name="year_level"
                                                value={editYearLevel}
                                                onChange={(event) =>
                                                    setEditYearLevel(
                                                        event.target.value,
                                                    )
                                                }
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
                                            defaultValue={
                                                editingCourse.academic_term_id ??
                                                ''
                                            }
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">
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
