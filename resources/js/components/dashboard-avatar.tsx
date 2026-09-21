import { Link, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { Auth } from '@/types';

interface PageProps {
    auth?: Auth;
    [key: string]: unknown;
}

export default function DashboardAvatar() {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();

    if (!auth?.user) {
        return null;
    }

    return (
        <Link
            href="/settings/profile"
            title="Edit profile picture"
            className="block aspect-square max-h-32 min-h-16 shrink-0 self-stretch"
        >
            <Avatar className="h-full w-full overflow-hidden rounded-full border-2 border-white/40 shadow-sm">
                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                <AvatarFallback className="bg-white/20 text-2xl font-semibold text-white">
                    {getInitials(auth.user.name)}
                </AvatarFallback>
            </Avatar>
        </Link>
    );
}
