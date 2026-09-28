export default function RoleBadge({ roleCode }) {
  const styles = {
    owner: 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300',
    admin: 'bg-sky-100 text-sky-900 dark:bg-sky-400/10 dark:text-sky-300',
    cashier: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300',
    inventory_manager: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-400/10 dark:text-indigo-300',
    accountant: 'bg-purple-100 text-purple-900 dark:bg-purple-400/10 dark:text-purple-300',
    auditor: 'bg-slate-100 text-slate-900 dark:bg-slate-400/10 dark:text-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[roleCode] || styles.auditor
      }`}
    >
      {roleCode?.replace('_', ' ') || 'unknown'}
    </span>
  );
}