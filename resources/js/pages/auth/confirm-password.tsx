import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

const inputClassName =
    'border-red-200 bg-white focus-visible:border-red-500 focus-visible:ring-red-200';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <div className="mb-4 text-sm text-slate-500">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                className={`mt-1 block w-full ${inputClassName}`}
                                autoFocus
                                placeholder="Password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 text-white hover:bg-red-700"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Confirm
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm your password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
