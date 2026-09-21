import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

interface AuthCardLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthCardLayoutProps>) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-red-50 px-4 py-10">
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-200/50" />
            <div className="pointer-events-none absolute -right-20 -bottom-32 h-96 w-96 rounded-full bg-red-100" />

            <div className="relative w-full max-w-lg">
                <Link
                    href={home()}
                    className="mb-6 flex flex-col items-center gap-3"
                >
                    <AppLogoIcon className="h-20 w-20 object-contain transition-transform duration-200 hover:scale-105" />

                    <div className="text-center">
                        <p className="text-sm font-bold tracking-wide text-red-800 uppercase">
                            Global Reciprocal Colleges
                        </p>

                        <p className="mt-1 text-xs font-medium text-red-600">
                            Learning Management System
                        </p>
                    </div>
                </Link>

                <Card className="border-red-200 bg-white shadow-xl shadow-red-900/5">
                    <CardHeader className="border-b border-red-100 bg-red-50/70 text-center">
                        {title && (
                            <CardTitle className="text-2xl font-bold text-red-950">
                                {title}
                            </CardTitle>
                        )}

                        {description && (
                            <CardDescription className="text-slate-600">
                                {description}
                            </CardDescription>
                        )}
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
