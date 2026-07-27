import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Bot, File, Map, Mic, TrendingUp, LogOut, Zap } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: FileText },
  { to: '/assistant', label: 'Assistant', icon: Bot },
  { to: '/resume', label: 'Resume', icon: File },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/mock-interview', label: 'Mock Interview', icon: Mic },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);

  function isActive(link) {
    if (link.to === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(link.to);
  }

  const navLinks = (compact) =>
    links.map((link) => (
      <Link
        key={link.to}
        to={link.to}
        onClick={mobileOpen ? onCloseMobile : undefined}
        className={`flex items-center gap-3 rounded-lg text-sm font-medium transition ${
          compact ? 'justify-center px-2 py-2' : 'px-3 py-2'
        } ${
          isActive(link)
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
        }`}
        title={compact ? link.label : undefined}
      >
        <link.icon className="h-5 w-5 shrink-0" />
        {!compact && <span className="truncate">{link.label}</span>}
      </Link>
    ));

  return (
    <>
      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-white dark:bg-surface-900 h-full transition-all duration-200 overflow-hidden ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex items-center h-14 px-2 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <button
            onClick={onToggleCollapse}
            className={`flex items-center gap-3 rounded-lg text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition w-full ${
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`h-4 w-4 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navLinks(collapsed)}
        </nav>

        <div className="border-t border-surface-200 dark:border-surface-700 p-2 shrink-0">
          <button
            onClick={logout}
            className={`flex items-center gap-3 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition w-full ${
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 flex flex-col h-full w-64 border-r bg-white dark:bg-surface-900 shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <Link to="/dashboard" onClick={onCloseMobile} className="flex items-center gap-3 min-w-0">
            <Zap className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
              CodePrep
            </span>
          </Link>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-xs font-bold text-primary-700 dark:text-primary-300">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
              {displayName}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
              {displayEmail}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(link)
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-surface-200 dark:border-surface-700 p-3">
          <button
            onClick={() => { logout(); onCloseMobile(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
