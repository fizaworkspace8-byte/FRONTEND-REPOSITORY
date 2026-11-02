function Badge({ tone = 'slate', dot = false, children, className }) {
  const TONES = {
    emerald: {
      light: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dark: 'dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    },
    amber: {
      light: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      dark: 'dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    },
    rose: {
      light: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      dark: 'dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
    },
    sky: {
      light: 'bg-sky-50 text-sky-700 ring-sky-600/20',
      dark: 'dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
    },
    slate: {
      light: 'bg-slate-50 text-slate-700 ring-slate-600/20',
      dark: 'dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
    },
    violet: {
      light: 'bg-violet-50 text-violet-700 ring-violet-600/20',
      dark: 'dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
    },
  };

  const toneMap = TONES[tone] || TONES.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneMap.light} ${toneMap.dark} ${className || ''}`}
    >
      {dot ? (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
