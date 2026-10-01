import { createInertiaApp } from '@inertiajs/react';

// Side-effect only: starts tracking in-app navigations from the very first
// page load, before any page has a chance to render a BackLink. Registering
// this any later (e.g. lazily, only when a page that uses BackLink mounts)
// would miss the navigation that brought the user to that very page, making
// "Back" wrongly think there's nothing to go back to.
import '@/lib/back-navigation';
import { configureEcho } from '@laravel/echo-react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Global Reciprocal Colleges';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    // layout: (name) => {
    //     switch (true) {
    //         case name === 'welcome':
    //             return null;

    //         case name.startsWith('auth/'):
    //             return AuthLayout;

    //         case name.startsWith('settings/'):
    //             return [AppLayout, SettingsLayout];

    //         default:
    //             return AppLayout;
    //     }
    // },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;

            case name === 'student/forced-password-change':
                // The student can't reach anything else in the portal yet —
                // showing the normal sidebar would just link to pages that
                // immediately redirect back here. The plain centered-card
                // auth chrome fits this better than the app shell.
                return AuthLayout;

            case name.endsWith('/meeting'):
                // Full-bleed video call — no floating dock/identity bar
                // overlapping Jitsi's own toolbar.
                return null;

            case name.startsWith('admin/'):
                return AppLayout;

            case name.startsWith('auth/'):
                return AuthLayout;

            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];

            default:
                return AppLayout;
        }
    },

    strictMode: true,

    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },

    progress: {
        color: '#dc2626',
    },
});

initializeTheme();
