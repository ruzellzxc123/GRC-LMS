<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    style="color-scheme: light;"
>
    <head>
        <meta charset="utf-8">
        <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
        >

        {{-- Force light theme before React loads --}}
        <script>
            (function () {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';

                try {
                    localStorage.setItem('appearance', 'light');
                } catch (error) {
                    console.warn('Unable to save appearance setting.');
                }

                document.cookie =
                    'appearance=light;path=/;max-age=31536000;SameSite=Lax';
            })();
        </script>

        <style>
            html,
            body {
                background-color: oklch(1 0 0);
                color-scheme: light;
            }
        </style>

        <link
          rel="icon"
    type="image/png"
    href="{{ asset('images/grc-icon.png') }}"
>

<link
    rel="apple-touch-icon"
    href="{{ asset('images/grc-icon.png') }}"
>

        @fonts

        @viteReactRefresh

        @vite([
            'resources/css/app.css',
            'resources/js/app.tsx',
            "resources/js/pages/{$page['component']}.tsx"
        ])

        <x-inertia::head>
            <title>{{ config('app.name', 'GRC LMS') }}</title>
        </x-inertia::head>
    </head>

    <body class="bg-white font-sans text-slate-900 antialiased">
        <x-inertia::app />
    </body>
</html>