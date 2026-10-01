import { Form, Head, Link } from '@inertiajs/react';
import { Save, UserRoundPen } from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSectionOptions } from '@/lib/section-options';

interface Student {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
    birthday: string | null;
    year_level: string | null;
    section: string | null;
}

interface EditStudentProps {
    student: Student;
}

export default function EditStudent({ student }: EditStudentProps) {
    const [yearLevel, setYearLevel] = useState(student.year_level ?? '');
    const sectionOptions = getSectionOptions(yearLevel);

    return (
        <>
            <Head title={`Edit ${student.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-5">
                        <BackLink href="/admin/students">
                            Back to students
                        </BackLink>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <UserRoundPen className="size-6" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Student
                                    </h1>

                                    <p className="mt-1 text-sm text-red-100">
                                        Update {student.name}'s information
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/admin/students/${student.id}`}
                            method="put"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={student.name}
                                            required
                                        />

                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="student_id">
                                                Student ID
                                            </Label>

                                            <Input
                                                id="student_id"
                                                defaultValue={
                                                    student.student_id ?? ''
                                                }
                                                disabled
                                                className="disabled:opacity-100"
                                            />

                                            <p className="text-xs text-slate-500">
                                                Student IDs are permanent and
                                                can't be changed after the
                                                account is created.
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>

                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                defaultValue={student.email}
                                                required
                                            />

                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="birthday">
                                            Birthday
                                        </Label>

                                        <Input
                                            id="birthday"
                                            name="birthday"
                                            type="date"
                                            defaultValue={
                                                student.birthday ?? ''
                                            }
                                        />

                                        <InputError message={errors.birthday} />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="year_level">
                                                Year Level
                                            </Label>

                                            <select
                                                id="year_level"
                                                name="year_level"
                                                value={yearLevel}
                                                onChange={(event) =>
                                                    setYearLevel(
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                            >
                                                <option value="" disabled>
                                                    Select year
                                                </option>

                                                <option value="1st Year">
                                                    1st Year
                                                </option>

                                                <option value="2nd Year">
                                                    2nd Year
                                                </option>

                                                <option value="3rd Year">
                                                    3rd Year
                                                </option>

                                                <option value="4th Year">
                                                    4th Year
                                                </option>
                                            </select>

                                            <InputError
                                                message={errors.year_level}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="section">
                                                Section
                                            </Label>

                                            <select
                                                key={yearLevel}
                                                id="section"
                                                name="section"
                                                defaultValue={
                                                    yearLevel ===
                                                    (student.year_level ?? '')
                                                        ? (student.section ??
                                                          '')
                                                        : ''
                                                }
                                                required
                                                disabled={
                                                    sectionOptions.length === 0
                                                }
                                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                            >
                                                <option value="" disabled>
                                                    {sectionOptions.length === 0
                                                        ? 'Select year level first'
                                                        : 'Select section'}
                                                </option>

                                                {sectionOptions.map(
                                                    (section) => (
                                                        <option
                                                            key={section}
                                                            value={section}
                                                        >
                                                            {section}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <InputError
                                                message={errors.section}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                        <Link
                                            href="/admin/students"
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
                </div>
            </div>
        </>
    );
}
