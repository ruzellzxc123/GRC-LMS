export type ResolvedAppearance = 'light';
export type Appearance = 'light' | 'dark' | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

function forceLightTheme(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    try {
        localStorage.setItem('appearance', 'light');
    } catch {
        // Local storage may be unavailable during SSR or private browsing.
    }

    document.cookie = 'appearance=light;path=/;max-age=31536000;SameSite=Lax';
}

export function initializeTheme(): void {
    forceLightTheme();
}

export function useAppearance(): UseAppearanceReturn {
    const updateAppearance = (): void => {
        forceLightTheme();
    };

    return {
        appearance: 'light',
        resolvedAppearance: 'light',
        updateAppearance,
    };
}
