import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, LogOut, Menu, Moon, Sun } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/platform/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-ink-950 text-slate-300 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <Logo className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              CircuitStock
            </p>
            <p className="text-xs text-slate-400">Platform Console</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          <Link
            to="/platform"
            className="sidebar-link bg-brand-400/10 text-brand-300"
          >
            <Boxes className="h-5 w-5" />
            <span>Tenants</span>
          </Link>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs leading-5 text-slate-500">
            Platform administrator area. Tenant data is isolated per tenant.
          </p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/60 lg:hidden"
          tabIndex={-1}
          aria-label="Close overlay"
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-ink-950/90 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="ml-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-sm font-semibold text-white ring-1 ring-white/10">
                {user?.full_name?.[0] || 'P'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}