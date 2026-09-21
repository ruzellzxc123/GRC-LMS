import AppLayoutTemplate from '@/layouts/app/app-dock-layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <AppLayoutTemplate>{children}</AppLayoutTemplate>;
}
