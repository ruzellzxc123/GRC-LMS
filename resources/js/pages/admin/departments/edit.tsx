import { Form, Head, Link, router } from '@inertiajs/react';
import { BookOpen, Download, Save, Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = 'regular' | 'bridging' | 'elective';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    curriculum_file_url: string | null;
    curriculum_file_name: string | null;
    curriculum_uploaded_at: string | null;
}

interface CurriculumSubject {
    id: number;
    department_id: number;
    year_level: string | null;
    semester: string | null;
    category: Category;
    code: string;
    title: string;
    lec: number | null;
    lab: number | null;
    units: string | null;
    pre_req: string | null;
    order: number;
}

interface EditDepartmentProps {
    department: Department;
    curriculum_subjects: CurriculumSubject[];
    year_levels: string[];
    semesters: string[];
}

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function EditDepartment({
    department,
    curriculum_subjects,
    year_levels,
    semesters,
}: EditDepartmentProps) {
    const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
    const [uploadingCurriculum, setUploadingCurriculum] = useState(false);
    const [curriculumFileError, setCurriculumFileError] = useState('');

    const submitCurriculumUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!curriculumFile) {
            setCurriculumFileError('Choose a file to upload.');

            return;
        }

        setUploadingCurriculum(true);
        setCurriculumFileError('');

        router.post(
            `/admin/departments/${department.id}/curriculum`,
            { curriculum_file: curriculumFile },
            {
                forceFormData: true,
                onSuccess: () => setCurriculumFile(null),
                onError: (errors) =>
                    setCurriculumFileError(errors.curriculum_file ?? ''),
                onFinish: () => setUploadingCurriculum(false),
            },
        );
    };

    const removeCurriculumFile = () => {
        if (
            !confirm(
                'Remove the curriculum file? This also clears the Subject Title list for this department.',
            )
        ) {
            return;
        }

        router.delete(`/admin/departments/${department.id}/curriculum`);
    };

    const groupedRegular = year_levels.map((level) => ({
        level,
        bySemester: semesters.map((semester) => ({
            semester,
            subjects: curriculum_subjects
                .filter(
                    (subject) =>
                        subject.category !== 'elective' &&
                        subject.year_level === level &&
                        subject.semester === semester,
                )
                .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code)),
        })),
    }));

    const electiveSubjects = curriculum_subjects
        .filter((subject) => subject.category === 'elective')
        .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));

    return (
        <>
            <Head title={`Edit ${department.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <BackLink
                        href="/admin/departments"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to departments
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <Save className="size-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Department
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        Update department details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/admin/departments/${department.id}`}
                            method="put"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            Department Name
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={department.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="code">
                                            Department Code
                                        </Label>
                                        <Input
                                            id="code"
                                            name="code"
                                            defaultValue={department.code}
                                            required
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            defaultValue={
                                                department.description ?? ''
                                            }
                                            className="min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href="/admin/departments"
                                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Link>
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
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6 pb-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <UploadCloud className="size-5 text-red-600" />
                                Curriculum File
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                This file is the system's source of subject
                                information for this department — professors
                                and admins pick from it (via the Subject Title
                                dropdown) when adding a new subject. There's no
                                separate manual entry step: upload a
                                spreadsheet and its rows become the list.
                                Re-uploading replaces the list entirely.
                            </p>
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                                <p className="font-semibold text-slate-700">
                                    Expected format: the official curriculum
                                    sheet layout (.xlsx, .xls, or .csv)
                                </p>
                                <p className="mt-1">
                                    One sheet, with a{' '}
                                    <code>FIRST YEAR</code> /{' '}
                                    <code>SECOND YEAR</code> /{' '}
                                    <code>THIRD YEAR</code> /{' '}
                                    <code>FOURTH YEAR</code> marker row before
                                    each year's block, a{' '}
                                    <code>First Semester</code> /{' '}
                                    <code>Second Semester</code> sub-header
                                    row, then a{' '}
                                    <code>Grade | Code | Title | Lec | Lab |
                                        Units | Pre-Req</code>{' '}
                                    header row — with the First Semester
                                    columns (B–G) and Second Semester columns
                                    (J–O) side by side, same as the printed
                                    curriculum map. A{' '}
                                    <code>Bridging Course</code> row marks the
                                    rows below it as bridging until the next{' '}
                                    <code>Total</code> row.
                                </p>
                                <p className="mt-1">
                                    Only Year 1–4 subjects are loaded —
                                    everything from a{' '}
                                    <code>PROFESSIONAL ELECTIVES</code> section
                                    onward is ignored.
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            {department.curriculum_file_name ? (
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {department.curriculum_file_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Uploaded{' '}
                                            {formatDate(
                                                department.curriculum_uploaded_at,
                                            )}{' '}
                                            — {curriculum_subjects.length}{' '}
                                            subject(s) loaded
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <a
                                            href={
                                                department.curriculum_file_url ??
                                                undefined
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                        >
                                            <Download className="size-3.5" />
                                            Download
                                        </a>
                                        <button
                                            type="button"
                                            onClick={removeCurriculumFile}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No curriculum file uploaded yet — the
                                    Subject Title dropdown for this department
                                    will be empty until one is.
                                </p>
                            )}

                            <form
                                onSubmit={submitCurriculumUpload}
                                className="mt-4 flex flex-wrap items-end gap-3"
                            >
                                <div className="grid gap-1.5">
                                    <Label htmlFor="curriculum_file">
                                        {department.curriculum_file_name
                                            ? 'Replace file'
                                            : 'Upload file'}
                                    </Label>
                                    <input
                                        id="curriculum_file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) =>
                                            setCurriculumFile(
                                                event.target.files?.[0] ??
                                                    null,
                                            )
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                                    />
                                    <InputError message={curriculumFileError} />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={uploadingCurriculum}
                                    className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                >
                                    <UploadCloud className="size-4" />
                                    {uploadingCurriculum
                                        ? 'Uploading...'
                                        : 'Upload'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6 pb-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <BookOpen className="size-5 text-red-600" />
                                Curriculum Subjects
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Loaded from the curriculum file above — this is
                                exactly what shows in the Subject Title
                                dropdown. To change it, upload an updated file.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100 p-6">
                            {groupedRegular.map(({ level, bySemester }) => {
                                const hasAny = bySemester.some(
                                    (group) => group.subjects.length > 0,
                                );

                                if (!hasAny) {
                                    return null;
                                }

                                return (
                                    <div key={level} className="py-4">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {level}
                                        </h3>

                                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                                            {bySemester.map(
                                                ({ semester, subjects }) =>
                                                    subjects.length > 0 && (
                                                        <div key={semester}>
                                                            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                                {semester}
                                                            </p>
                                                            <SubjectTable
                                                                subjects={
                                                                    subjects
                                                                }
                                                            />
                                                        </div>
                                                    ),
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {electiveSubjects.length > 0 && (
                                <div className="py-4">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Professional Electives
                                    </h3>
                                    <p className="mb-2 text-xs text-slate-500">
                                        A shared pool, not tied to a specific
                                        year or semester.
                                    </p>
                                    <SubjectTable subjects={electiveSubjects} />
                                </div>
                            )}

                            {curriculum_subjects.length === 0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    No curriculum subjects yet — upload a
                                    curriculum file above to populate this
                                    list.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function SubjectTable({ subjects }: { subjects: CurriculumSubject[] }) {
    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="text-xs text-slate-500">
                    <th className="py-1 pr-2">Code</th>
                    <th className="py-1 pr-2">Title</th>
                    <th className="py-1 pr-2">Units</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {subjects.map((subject) => (
                    <tr key={subject.id}>
                        <td className="py-1.5 pr-2 font-medium text-slate-700">
                            {subject.code}
                            {subject.category === 'bridging' && (
                                <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Bridging
                                </span>
                            )}
                        </td>
                        <td className="py-1.5 pr-2 text-slate-600">
                            {subject.title}
                        </td>
                        <td className="py-1.5 pr-2 text-slate-600">
                            {subject.units ?? '—'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
