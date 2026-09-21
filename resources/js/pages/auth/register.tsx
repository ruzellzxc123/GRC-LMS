import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { appendGmailDomain } from '@/lib/email-format';
import { formatStudentIdSuffix } from '@/lib/id-format';
import { getSectionOptions } from '@/lib/section-options';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules?: string;
    adminMode?: boolean;
    accountType?: 'student' | 'professor';
};

const ENROLLMENT_YEAR = new Date().getFullYear();

export default function Register({
    passwordRules,
    adminMode = false,
    accountType = 'student',
}: Props) {
    const isAdminCreatingStudent = adminMode && accountType === 'student';
    const [yearLevel, setYearLevel] = useState('');
    const [studentIdSuffix, setStudentIdSuffix] = useState('');
    const sectionOptions = getSectionOptions(yearLevel);

    const formConfiguration = isAdminCreatingStudent
        ? {
              action: '/admin/students',
              method: 'post' as const,
          }
        : store.form();

    return (
        <>
            <Head
                title={
                    isAdminCreatingStudent
                        ? 'Add Student'
                        : 'Student Registration'
                }
            />

            <Form
                {...formConfiguration}
                resetOnSuccess={['password', 'password_confirmation']}
                onSuccess={() => setStudentIdSuffix('')}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* Full name */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>

                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Enter full name"
                                />

                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            {/* Student ID */}
                            <div className="grid gap-2">
                                <Label htmlFor="student_id_suffix">
                                    Student ID
                                </Label>

                                <div className="flex items-center gap-2">
                                    <span className="flex h-9 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                                        {ENROLLMENT_YEAR}-
                                    </span>

                                    <Input
                                        id="student_id_suffix"
                                        type="text"
                                        required
                                        tabIndex={2}
                                        autoComplete="off"
                                        placeholder="00-00000"
                                        maxLength={8}
                                        value={studentIdSuffix}
                                        onChange={(event) =>
                                            setStudentIdSuffix(
                                                formatStudentIdSuffix(
                                                    event.currentTarget.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    The ID starts with the current enrollment
                                    year ({ENROLLMENT_YEAR}) automatically.
                                </p>

                                <input
                                    type="hidden"
                                    name="student_id"
                                    value={`${ENROLLMENT_YEAR}-${studentIdSuffix}`}
                                />

                                <InputError message={errors.student_id} />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={3}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="username@gmail.com"
                                    onBlur={(event) => {
                                        event.currentTarget.value =
                                            appendGmailDomain(
                                                event.currentTarget.value,
                                            );
                                    }}
                                />

                                <InputError message={errors.email} />
                            </div>

                            {/* Birthday */}
                            <div className="grid gap-2">
                                <Label htmlFor="birthday">Birthday</Label>

                                <Input
                                    id="birthday"
                                    type="date"
                                    tabIndex={4}
                                    name="birthday"
                                />

                                <InputError message={errors.birthday} />
                            </div>

                            {/* Program */}
                            <div className="grid gap-2">
                                <Label htmlFor="program">Program</Label>

                                <select
                                    id="program"
                                    name="program"
                                    required
                                    tabIndex={5}
                                    defaultValue=""
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" disabled>
                                        Select a program
                                    </option>

                                    <option value="Bachelor of Science In Computer Science">
                                        Bachelor of Science In Computer Science
                                    </option>

                                    <option value="Bachelor of Science In Education">
                                        Bachelor of Science In Education
                                    </option>

                                    <option value="Bachelor of Science In Accounting">
                                        Bachelor of Science In Accounting
                                    </option>
                                </select>

                                <InputError message={errors.program} />
                            </div>

                            {/* Year level and section */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="year_level">
                                        Year level
                                    </Label>

                                    <select
                                        id="year_level"
                                        name="year_level"
                                        required
                                        tabIndex={6}
                                        value={yearLevel}
                                        onChange={(event) =>
                                            setYearLevel(event.target.value)
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>
                                            Select year level
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

                                    <InputError message={errors.year_level} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="section">Section</Label>

                                    <select
                                        key={yearLevel}
                                        id="section"
                                        name="section"
                                        required
                                        tabIndex={7}
                                        disabled={sectionOptions.length === 0}
                                        defaultValue=""
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>
                                            {sectionOptions.length === 0
                                                ? 'Select year level first'
                                                : 'Select section'}
                                        </option>

                                        {sectionOptions.map((section) => (
                                            <option
                                                key={section}
                                                value={section}
                                            >
                                                {section}
                                            </option>
                                        ))}
                                    </select>

                                    <InputError message={errors.section} />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>

                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={8}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm password */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={9}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Submit button */}
                            <Button
                                type="submit"
                                className="mt-2 w-full bg-red-700 text-white hover:bg-red-800"
                                tabIndex={10}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}

                                {isAdminCreatingStudent
                                    ? 'Create Student Account'
                                    : 'Register Student'}
                            </Button>
                        </div>

                        {/* Only show login link publicly */}
                        {!adminMode && (
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <TextLink href={login()} tabIndex={11}>
                                    Log in
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Student Registration',
    description: 'Enter the student information below to create an account',
};
