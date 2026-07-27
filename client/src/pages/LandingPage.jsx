import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Curated Problems',
    description: '50+ hand-picked DSA problems across Arrays, Trees, Graphs, DP and more, organized by difficulty and topic.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Hints',
    description: 'Stuck on a problem? Get progressive AI hints — concept, approach, and detailed guidance — without spoiling the solution.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Resume Analyzer',
    description: 'Upload your resume and let AI extract your skills, then generate tailored interview questions for your target role.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    title: 'Smart Roadmap',
    description: 'Get a personalized study plan tailored to your level, target role, and weak topics — 30, 60, or 90 day roadmap.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
    title: 'Track Progress',
    description: 'Visualize your solving history with activity heatmaps, difficulty breakdowns, and topic-wise progress charts.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'AI Assistant',
    description: 'Ask DSA questions in natural language and get answers grounded in the knowledge base — like a mentor on demand.',
  },
];

export default function LandingPage() {
  const { token } = useAuth();

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="border-b border-surface-200 dark:border-surface-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              C
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
              CodePrep
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 to-transparent dark:from-primary-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-6xl">
              Master DSA with{' '}
              <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Guidance
            </h1>
            <p className="mt-6 text-lg leading-8 text-surface-500 dark:text-surface-400">
              Practice curated problems, get intelligent hints, analyze your resume,
              and follow a personalized roadmap — all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                to="/register"
                className="rounded-xl bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition"
              >
                Start free
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-8 py-3 text-base font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
              Everything you need to crack the interview
            </h2>
            <p className="mt-4 text-surface-500 dark:text-surface-400">
              From problem-solving to interview preparation, CodePrep AI supports your entire journey.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 transition hover:border-primary-500/50 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 transition group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-600">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-surface-200 dark:border-surface-800 bg-primary-600/5 dark:bg-primary-500/5">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Ready to level up?
          </h2>
          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
            Join CodePrep AI and start your journey toward landing your dream job.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="rounded-xl bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition"
            >
              Get started — it's free
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-surface-400">
          CodePrep AI — Built with React, Express, MongoDB, and AI
        </div>
      </footer>
    </div>
  );
}
