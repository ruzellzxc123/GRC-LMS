import { Link } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import type { User } from '@/types/auth';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left">
                    <UserInfo user={user} showEmail />
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        href="/settings/profile"
                        className="flex w-full cursor-pointer items-center gap-2"
                    >
                        <Settings className="size-4" />

                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex w-full cursor-pointer items-center gap-2 text-red-700"
                >
                    <LogOut className="size-4" />

                    <span>Logout</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}
