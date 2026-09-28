import Logo from '../components/Logo';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-ink-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-14 w-14" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              CircuitStock Inventory
            </h1>
            {title && (
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="card p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}