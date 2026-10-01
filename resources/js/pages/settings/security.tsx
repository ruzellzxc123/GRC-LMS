import { Form, Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PasswordStrengthMeter from '@/components/password-strength-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
    passwordChangePending: boolean;
};

export default function Security({
    passwordRules,
    passwordChangePending,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const codeInput = useRef<HTMLInputElement>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resending, setResending] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const resendCode = () => {
        setResending(true);
        router.post(
            SecurityController.resendCode.url(),
            {},
            { preserveScroll: true, onFinish: () => setResending(false) },
        );
    };

    const cancelChange = () => {
        setCancelling(true);
        router.delete(SecurityController.cancelUpdate.url(), {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
        });
    };

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description={
                        passwordChangePending
                            ? 'Enter the 8-digit code we emailed you to confirm this change.'
                            : 'Ensure your account is using a long, random password to stay secure'
                    }
                />

                {passwordChangePending ? (
                    <Form
                        {...SecurityController.confirmUpdate.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['code']}
                        onError={() => codeInput.current?.focus()}
                        className="space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid max-w-xs gap-2">
                                    <Label htmlFor="code">
                                        Verification code
                                    </Label>

                                    <Input
                                        id="code"
                                        ref={codeInput}
                                        name="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={8}
                                        placeholder="8-digit code"
                                        className="text-center text-lg tracking-[0.3em]"
                                    />

                                    <InputError message={errors.code} />
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="confirm-password-change-button"
                                    >
                                        Confirm change
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={resendCode}
                                        disabled={resending}
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    >
                                        {resending ? 'Sending…' : 'Resend code'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={cancelChange}
                                        disabled={cancelling}
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                ) : (
                    <Form
                        {...SecurityController.requestUpdate.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onSuccess={() => setNewPassword('')}
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>

                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>

                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="New password"
                                        passwordrules={passwordRules}
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                    />

                                    <PasswordStrengthMeter
                                        password={newPassword}
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>

                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                        passwordrules={passwordRules}
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    After saving, we'll email an 8-digit code to
                                    confirm this change before it takes effect.
                                </p>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
