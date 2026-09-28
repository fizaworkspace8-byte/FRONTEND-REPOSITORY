import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children, requiredType = 'tenant' }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectPath =
      requiredType === 'platform' ? '/platform/login' : '/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (requiredType === 'platform' && user?.type !== 'platform') {
    return <Navigate to="/" replace />;
  }

  if (requiredType === 'tenant' && user?.type !== 'tenant') {
    return <Navigate to="/platform" replace />;
  }

  return children;
}