import { Form, Head, Link } from '@inertiajs/react';
import { GraduationCap, UserPlus } from 'lucide-react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { appendGmailDomain } from '@/lib/email-format';
import { formatProfessorId } from '@/lib/id-format';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface CreateProfessorProps {
    departments: Department[];
    passwordRules?: string;
}

export default function CreateProfessor({
    departments,
    passwordRules,
}: CreateProfessorProps) {
    return (
        <>
            <Head title="Add Professor" />

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
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <GraduationCap className="size-7" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Add Professor
                                    </h1>

                                    <p className="mt-1 text-sm text-red-100">
                                        Create a new professor LMS account
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action="/admin/professors"
                            method="post"
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    {/* Professor ID */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="professor_id">
                                            Professor ID
                                        </Label>

                                        <Input
                                            id="professor_id"
                                            name="professor_id"
                                            required
                                            autoFocus
                                            placeholder="0000-000"
                                            maxLength={8}
                                            onInput={(event) => {
                                                event.currentTarget.value =
                                                    formatProfessorId(
                                                        event.currentTarget
                                                            .value,
                                                    );
                                            }}
                                        />

                                        <InputError
                                            message={errors.professor_id}
                                        />
                                    </div>

                                    {/* Name */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>

                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            placeholder="Professor full name"
                                        />

                                        <InputError message={errors.name} />
                                    </div>

                                    {/* Email */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email Address
                                        </Label>

                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="username@gmail.com"
                                            onBlur={(event) => {
                                                event.currentTarget.value =
                                                    appendGmailDomain(
                                                        event.currentTarget
                                                            .value,
                                                    );
                                            }}
                                        />

                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Department */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="department">
                                            Department
                                        </Label>

                                        <select
                                            id="department"
                                            name="department"
                                            required
                                            defaultValue=""
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

                                    {/* Password */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            autoComplete="new-password"
                                            placeholder="Password"
                                            passwordrules={passwordRules}
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Confirm Password
                                        </Label>

                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            required
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                            passwordrules={passwordRules}
                                        />

                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href="/admin/professors"
                                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Link>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <UserPlus className="size-4" />
                                            )}
                                            Create Professor
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
