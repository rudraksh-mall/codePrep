import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDailyProblem } from '../../hooks/useDailyProblem';
import { useProgress } from '../../hooks/useProgress';
import { Zap } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

export default function Navbar({ onToggleMobileDrawer }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: dailyProblem } = useDailyProblem();
  const { data: progressData } = useProgress();

  const isDailySolved = dailyProblem?.problemSlug && progressData?.some(
    (p) => p.problemId?.slug === dailyProblem.problemSlug && p.status === 'solved'
  );
  const showDailyDot = Boolean(dailyProblem && !isDailySolved);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);

  return (
    <nav className="sticky top-0 z-40 border-b bg-white dark:bg-surface-900 shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            onClick={onToggleMobileDrawer}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/dashboard" className="relative flex items-center gap-2 text-lg font-bold text-primary-600 dark:text-primary-400">
            <Zap className="h-6 w-6" />
            <span className="truncate">CodePrep</span>
            {showDailyDot && (
              <span className="absolute -top-1 -right-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </Link>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            aria-label="User menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-xs font-bold text-primary-700 dark:text-primary-300">
              {initials}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  {displayEmail}
                </p>
              </div>

              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
