import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login } from '@/routes';

interface WelcomePageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role?: 'admin' | 'professor' | 'student';
        } | null;
    };
    [key: string]: unknown;
}

const carouselImages = [
    {
        src: '/images/lms-carousel/slide-1.jpg',
        alt: 'Global Reciprocal College campus',
    },
    {
        src: '/images/lms-carousel/slide-2.jpg',
        alt: 'Global Reciprocal College students',
    },
    {
        src: '/images/lms-carousel/slide-3.jpg',
        alt: 'College classroom and learning activities',
    },
    {
        src: '/images/lms-carousel/slide-4.jpg',
        alt: 'Global Reciprocal College school event',
    },
    {
        src: '/images/lms-carousel/slide-5.jpg',
        alt: 'Global Reciprocal College school event',
    },
];

export default function Welcome() {
    const { auth } = usePage<WelcomePageProps>().props;

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentSlide((previousSlide) =>
                previousSlide === carouselImages.length - 1
                    ? 0
                    : previousSlide + 1,
            );
        }, 4000);

        return () => window.clearInterval(interval);
    }, []);

    const showPreviousSlide = () => {
        setCurrentSlide((previousSlide) =>
            previousSlide === 0 ? carouselImages.length - 1 : previousSlide - 1,
        );
    };

    const showNextSlide = () => {
        setCurrentSlide((previousSlide) =>
            previousSlide === carouselImages.length - 1 ? 0 : previousSlide + 1,
        );
    };

    return (
        <>
            <Head title="Global Reciprocal College LMS" />

            <div className="min-h-screen bg-[#f8f8f8] text-slate-800">
                <header className="border-b border-red-100 bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
                        <Link
                            href="/"
                            className="flex min-w-0 items-center gap-3"
                        >
                            <img
                                src="/images/grc-icon.png"
                                alt="Global Reciprocal College logo"
                                className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
                            />

                            <div className="min-w-0">
                                <p className="text-sm leading-tight font-bold text-slate-700 sm:text-base">
                                    Global Reciprocal College
                                </p>

                                <p className="mt-0.5 text-[11px] leading-tight font-semibold tracking-wide text-red-600 uppercase sm:text-xs">
                                    Learning Management System
                                </p>
                            </div>
                        </Link>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:outline-none"
                                >
                                    Log In
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:outline-none sm:px-4"
                                    >
                                        Log in
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    <section className="relative overflow-hidden">
                        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-red-100/70 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />

                        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-24">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                                    <GraduationCap className="h-4 w-4" />
                                    Student Learning Portal
                                </div>

                                <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight text-slate-700 sm:text-5xl lg:text-6xl">
                                    Global Reciprocal College
                                </h1>

                                <p className="mt-3 text-xl font-bold text-red-600 sm:text-2xl">
                                    Learning Management System
                                </p>

                                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                    A centralized learning environment where
                                    students can access subjects, complete
                                    activities, monitor deadlines, and track
                                    their academic progress.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl"
                                        >
                                            Get Started
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={login()}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl"
                                            >
                                                Access Your Account
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>

                                            <a
                                                href="https://grc.edu.ph/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Visit Our Website
                                                <ArrowRight className="h-4 w-4" />
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-xl">
                                <div className="absolute -inset-4 rounded-[2rem] bg-red-100/70 blur-2xl" />

                                <div className="relative overflow-hidden rounded-[2rem] bg-transparent p-3 shadow-slate-900/10 sm:p-4">
                                    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-slate-100">
                                        {carouselImages.map((image, index) => (
                                            <img
                                                key={image.src}
                                                src={image.src}
                                                alt={image.alt}
                                                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
                                                    index === currentSlide
                                                        ? 'scale-100 opacity-100'
                                                        : 'pointer-events-none scale-105 opacity-0'
                                                }`}
                                            />
                                        ))}

                                        {/* Slide indicators */}
                                        <div className="absolute right-0 bottom-5 left-0 flex justify-center gap-2">
                                            {carouselImages.map(
                                                (image, index) => (
                                                    <button
                                                        key={image.src}
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrentSlide(
                                                                index,
                                                            )
                                                        }
                                                        aria-label={`Show image ${index + 1}`}
                                                        className={`h-2.5 rounded-full transition-all ${
                                                            index ===
                                                            currentSlide
                                                                ? 'w-8 bg-red-600'
                                                                : 'w-2.5 bg-white/80 hover:bg-white'
                                                        }`}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="bg-slate-700 text-slate-300">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-center text-xs sm:flex-row sm:px-8 sm:text-left lg:px-10">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/grc-icon.png"
                                alt=""
                                className="h-8 w-8 object-contain"
                            />

                            <span>
                                Global Reciprocal College Learning Management
                                System
                            </span>
                        </div>

                        <p>
                            © {new Date().getFullYear()} Global Reciprocal
                            College
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
