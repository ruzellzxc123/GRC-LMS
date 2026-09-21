import { Form, Head, Link } from '@inertiajs/react';
import { GraduationCap, Save } from 'lucide-react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatIdNumber } from '@/lib/id-format';

interface Professor {
    id: number;
    professor_id: string | null;
    name: string;
    email: string;
    department: string | null;
    program: string | null;
    is_active: boolean;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface EditProfessorProps {
    professor: Professor;
    departments: Department[];
}

export default function EditProfessor({
    professor,
    departments,
}: EditProfessorProps) {
    return (
        <>
            <Head title={`Edit ${professor.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <BackLink
                        href="/admin/professors"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to professors
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="size-7" />

                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Professor
                                    </h1>

                                    <p className="mt-1 text-sm text-red-100">
                                        Update {professor.name}'s information
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/admin/professors/${professor.id}`}
                            method="put"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="professor_id">
                                            Professor ID
                                        </Label>

                                        <Input
                                            id="professor_id"
                                            name="professor_id"
                                            defaultValue={
                                                professor.professor_id ?? ''
                                            }
                                            placeholder="0000-00-00000"
                                            maxLength={13}
                                            required
                                            onInput={(event) => {
                                                event.currentTarget.value =
                                                    formatIdNumber(
                                                        event.currentTarget
                                                            .value,
                                                    );
                                            }}
                                        />

                                        <InputError
                                            message={errors.professor_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>

                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={professor.name}
                                            required
                                        />

                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>

                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={professor.email}
                                            required
                                        />

                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="department">
                                            Department
                                        </Label>

                                        <select
                                            id="department"
                                            name="department"
                                            defaultValue={
                                                professor.department ?? ''
                                            }
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                Select department
                                            </option>

                                            {departments.map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.name}
                                                >
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>

                                        <InputError
                                            message={errors.department}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="program">Program</Label>

                                        <select
                                            id="program"
                                            name="program"
                                            defaultValue={
                                                professor.program ?? ''
                                            }
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                Select a program
                                            </option>

                                            <option value="Bachelor of Science In Computer Science">
                                                Bachelor of Science In Computer
                                                Science
                                            </option>

                                            <option value="Bachelor of Science In Education">
                                                Bachelor of Science In Education
                                            </option>

                                            <option value="Bachelor of Science In Accounting">
                                                Bachelor of Science In
                                                Accounting
                                            </option>
                                        </select>

                                        <InputError message={errors.program} />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href="/admin/professors"
                                            className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold"
                                        >
                                            Cancel
                                        </Link>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-red-600 hover:bg-red-700"
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
