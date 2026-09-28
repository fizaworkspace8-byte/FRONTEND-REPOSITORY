import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { api } from '../lib/api';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [openCount, setOpenCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const canSeeAlerts = Boolean(user?.permissions?.includes('products.read'));

  const loadCount = useCallback(async () => {
    try {
      const res = await api.get('/alerts/open-count');
      setOpenCount(res.openAlerts);
    } catch {
      /* badge is non-critical; stay silent */
    }
  }, []);

  useEffect(() => {
    if (!canSeeAlerts) return undefined;
    loadCount();
    const timer = setInterval(loadCount, 60000);
    return () => clearInterval(timer);
  }, [canSeeAlerts, loadCount]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function toggleDropdown() {
    const next = !dropdownOpen;
    setDropdownOpen(next);
    if (next) {
      loadCount();
      try {
        const res = await api.get('/alerts?status=open&limit=5');
        setRecent(res.alerts);
      } catch {
        setRecent([]);
      }
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-ink-950/90 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-xl flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search products, SKUs, invoices..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
          disabled
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {canSeeAlerts ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={toggleDropdown}
              className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
              aria-label={`Notifications — ${openCount} open alert${openCount === 1 ? '' : 's'}`}
              aria-expanded={dropdownOpen}
            >
              <Bell className="h-4 w-4" />
              {openCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-ink-950">
                  {openCount > 99 ? '99+' : openCount}
                </span>
              ) : null}
            </button>

            {dropdownOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-ink-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Stock alerts
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {openCount} open
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recent.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      No open alerts. All stock is above its thresholds.
                    </p>
                  ) : (
                    recent.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/alerts');
                        }}
                        className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60"
                      >
                        <span
                          className={`mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full ${
                            a.alert_type === 'out_of_stock' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                            {a.sku}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {a.alert_type === 'out_of_stock'
                              ? 'Out of stock'
                              : `Low stock — ${Number(a.quantity_on_hand)} / ${Number(a.reorder_level)}`}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/alerts');
                  }}
                  className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-brand-400 dark:hover:bg-slate-800/60"
                >
                  View all alerts
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ml-1 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-sm font-semibold text-white ring-1 ring-white/10">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
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
  );
}