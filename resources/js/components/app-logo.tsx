import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex size-13 shrink-0 items-center justify-center overflow-hidden">
                <AppLogoIcon className="h-full w-full object-contain" />
            </div>

            <div className="ml-2 min-w-0 flex-1 text-left">
                <span className="block text-[15px] leading-tight font-bold text-white">
                    Global Reciprocal
                    <br />
                    Colleges
                </span>

                <span className="mt-0.5 block truncate text-[10px] leading-tight text-brand-beige/70">
                    Learning Management System
                </span>
            </div>
        </>
    );
}
