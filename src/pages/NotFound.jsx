import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-lg">
        <EmptyState
          icon={Boxes}
          title="Page not found"
          description="The screen you requested does not exist in this version of CircuitStock."
        />
        <Link
          to="/"
          className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}