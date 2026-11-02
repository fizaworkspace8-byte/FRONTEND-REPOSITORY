import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Ambient background glows for dramatic glassmorphism blur reflections */}
      <div
        className="pointer-events-none fixed -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-600/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-20 -left-20 h-[500px] w-[500px] rounded-full bg-amber-400/20 blur-[120px] dark:bg-amber-600/10"
        aria-hidden="true"
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          tabIndex={-1}
        />
      ) : null}

      <div className="relative lg:pl-72">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}