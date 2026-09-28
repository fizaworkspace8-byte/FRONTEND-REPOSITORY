import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { downloadFile } from '../lib/documents';

const money = (v) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const dateFmt = (d) =>
  new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const SOURCE_TYPE_LABELS = {
  sale: 'Sale',
  sale_payment: 'Sale payment',
  sale_cancellation: 'Sale cancellation',
  goods_receipt: 'Goods receipt',
  supplier_bill: 'Supplier bill',
  supplier_payment: 'Supplier payment',
  purchase_return: 'Purchase return',
  expense: 'Expense',
  owner_contribution: 'Owner contribution',
  owner_withdrawal: 'Owner withdrawal',
  opening_balance: 'Opening balances',
  reversal: 'Reversal',
  manual: 'Manual entry',
};

const MANUALLY_REVERSIBLE = [
  'manual',
  'owner_contribution',
  'owner_withdrawal',
  'opening_balance',
];

const ACCOUNT_TYPE_LABELS = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expenses',
};

function Modal({ open, onClose, children, maxWidth = 'max-w-2xl' }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={`card relative w-full ${maxWidth} max-h-[calc(100vh-4rem)] overflow-y-auto p-6`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
      {message}
    </p>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone = 'default' }) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {Icon ? <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" /> : null}
      </div>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          tone === 'negative'
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [netWorth, setNetWorth] = useState(null);
  const [summary, setSummary] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nw, sm] = await Promise.all([
        api.get('/finance/net-worth'),
        api.get('/finance/summary'),
      ]);
      setNetWorth(nw);
      setSummary(sm);
    } catch (err) {
      setError(err.message || 'Failed to load finance overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const grouped = { asset: [], liability: [], equity: [], income: [], expense: [] };
  for (const a of summary?.accounts || []) {
    if (a.account_type && grouped[a.account_type]) grouped[a.account_type].push(a);
  }

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net worth"
          value={money(netWorth?.netWorth)}
          sub="What the business owns minus what it owes"
          icon={Wallet}
        />
        <StatCard label="Total assets" value={money(netWorth?.totalAssets)} icon={Scale} />
        <StatCard
          label="Total liabilities"
          value={money(netWorth?.totalLiabilities)}
          tone="negative"
        />
        <StatCard
          label="Profit to date"
          value={money(netWorth?.equityBreakdown?.retainedEarnings)}
          sub="Income minus expenses, all time"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Owner's equity</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Capital invested</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {money(netWorth?.equityBreakdown?.ownerCapital)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Owner withdrawals</dt>
              <dd className="font-medium text-rose-600 dark:text-rose-400">
                {money(netWorth?.equityBreakdown?.ownerDrawings)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Profit to date</dt>
              <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                {money(netWorth?.equityBreakdown?.retainedEarnings)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <dt className="font-semibold text-slate-900 dark:text-white">Total equity</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {money(netWorth?.equityBreakdown?.total)}
              </dd>
            </div>
          </dl>
          <p
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              netWorth?.balanced
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-300'
            }`}
          >
            {netWorth?.balanced ? 'Books balanced' : 'Books out of balance — investigate'}
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Integrity checks</h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle2
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  Math.abs((summary?.debitsTotal || 0) - (summary?.creditsTotal || 0)) < 0.005
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Ledger balances</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total debits {money(summary?.debitsTotal)} = total credits {money(summary?.creditsTotal)}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  summary?.inventoryCheck?.matches ? 'text-emerald-500' : 'text-rose-500'
                }`}
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Inventory matches stock</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Book value {money(summary?.inventoryCheck?.ledgerBalance)} vs stock value{' '}
                  {money(summary?.inventoryCheck?.stockValue)}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cash position</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Cash on hand</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {money(grouped.asset.find((a) => a.system_code === 'cash')?.display_balance)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Bank</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {money(grouped.asset.find((a) => a.system_code === 'bank')?.display_balance)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Customers owe (AR)</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {money(grouped.asset.find((a) => a.system_code === 'accounts_receivable')?.display_balance)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">We owe suppliers (AP)</dt>
              <dd className="font-medium text-rose-600 dark:text-rose-400">
                {money(grouped.liability.find((a) => a.system_code === 'accounts_payable')?.display_balance)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Chart of accounts — trial balance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Account</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(grouped).map(([type, accounts]) =>
                accounts
                  .filter((a) => a.line_count > 0 || a.is_system)
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{a.code}</td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">{a.name}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        {ACCOUNT_TYPE_LABELS[a.account_type]}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white">
                        {a.line_count === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          money(a.display_balance)
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal tab
// ---------------------------------------------------------------------------

function JournalDetailModal({ entryId, onClose, onReversed }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reversing, setReversing] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!entryId) return;
      setLoading(true);
      setError('');
      try {
        const result = await api.get(`/finance/journal-entries/${entryId}`);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load entry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const canReverse = data && MANUALLY_REVERSIBLE.includes(data.entry.source_type);

  async function handleReverse() {
    setReversing(true);
    setError('');
    try {
      await api.post(`/finance/journal-entries/${entryId}/reverse`, reason ? { reason } : {});
      onReversed();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reverse entry.');
      setReversing(false);
    }
  }

  return (
    <Modal open={Boolean(entryId)} onClose={onClose} maxWidth="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Journal entry #{data?.entry?.entry_number ?? '…'}
          </h2>
          {data ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {dateFmt(data.entry.entry_date)} · {SOURCE_TYPE_LABELS[data.entry.source_type] || data.entry.source_type}
              {data.entry.reversal_of_number ? ` · reverses #${data.entry.reversal_of_number}` : ''}
              {data.entry.reversed_by_number ? ` · reversed by #${data.entry.reversed_by_number}` : ''}
            </p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Account</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Memo</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.lines || []).map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{line.account_code}</span>{' '}
                      <span className="text-slate-900 dark:text-white">{line.account_name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{line.memo || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white">
                      {Number(line.debit) > 0 ? money(line.debit) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white">
                      {Number(line.credit) > 0 ? money(line.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ErrorBanner message={error} />

          {canReverse ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                This entry type can be reversed manually.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="h-10 flex-1 rounded-xl border border-amber-300 bg-white px-3 text-sm dark:border-amber-400/30 dark:bg-slate-900 dark:text-white"
                />
                <button
                  onClick={handleReverse}
                  disabled={reversing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {reversing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reverse entry
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}

function JournalTab() {
  const limit = 25;
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sourceType, setSourceType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let path = `/finance/journal-entries?limit=${limit}&offset=${offset}`;
      if (sourceType) path += `&sourceType=${encodeURIComponent(sourceType)}`;
      const result = await api.get(path);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || 'Failed to load journal entries.');
    } finally {
      setLoading(false);
    }
  }, [offset, sourceType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value);
            setOffset(0);
          }}
          className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total} entr{total === 1 ? 'y' : 'ies'}
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">#</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Memo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Source</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No journal entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setDetailId(e.id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{e.entry_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{dateFmt(e.entry_date)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.memo || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {SOURCE_TYPE_LABELS[e.source_type] || e.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {money(e.total_debit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Previous
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= total || loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>

      <JournalDetailModal
        entryId={detailId}
        onClose={() => setDetailId(null)}
        onReversed={load}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expenses tab
// ---------------------------------------------------------------------------

function RecordExpenseModal({ open, onClose, onSaved, accounts }) {
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [expenseDate, setExpenseDate] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAccountId('');
      setAmount('');
      setMethod('cash');
      setExpenseDate('');
      setReference('');
      setNotes('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = {
        accountId,
        amount: Number(amount),
        method,
      };
      if (expenseDate) body.expenseDate = expenseDate;
      if (reference) body.reference = reference;
      if (notes) body.notes = notes;
      await api.post('/finance/expenses', body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Record expense</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Money paid out for running the business.
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Category *</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required className={inputCls}>
            <option value="">Select category…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Amount *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Paid by *</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt no., etc. (optional)"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <ErrorBanner message={error} />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            Save expense
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewCategoryModal({ open, onClose, onSaved }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/finance/accounts', {
        code,
        name,
        accountType: 'expense',
        accountSubtype: 'operating',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New expense category</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            e.g. 5700 — Packaging Supplies
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="5700"
              required
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Packaging Supplies"
              required
              className={inputCls}
            />
          </div>
        </div>

        <ErrorBanner message={error} />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CancelExpenseModal({ expense, onClose, onSaved }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/finance/expenses/${expense.id}/cancel`, reason ? { reason } : {});
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel expense.');
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(expense)} onClose={onClose} maxWidth="max-w-md">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cancel expense #{expense?.expense_number}?</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        This posts a reversal entry — the money returns to the account it was paid from. The record is kept.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Keep expense
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel expense
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecord, setShowRecord] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [expResult, acctResult] = await Promise.all([
        api.get('/finance/expenses?limit=25&offset=0'),
        api.get('/finance/accounts'),
      ]);
      setExpenses(expResult.expenses);
      setTotal(expResult.total);
      setAccounts(
        acctResult.accounts.filter(
          (a) => a.account_type === 'expense' && !a.system_code && a.is_active
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowRecord(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" /> Record expense
        </button>
        <button
          onClick={() => setShowCategory(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Tag className="h-4 w-4" /> New category
        </button>
        {total > expenses.length ? (
          <p className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            Showing latest {expenses.length} of {total}
          </p>
        ) : null}
      </div>

      <ErrorBanner message={error} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">#</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Category</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Paid by</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{e.expense_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{dateFmt(e.expense_date)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.account_name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      {money(e.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.status === 'posted'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.status === 'posted' ? (
                        <button
                          onClick={() => setCancelling(e)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordExpenseModal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        onSaved={load}
        accounts={accounts}
      />
      <NewCategoryModal open={showCategory} onClose={() => setShowCategory(false)} onSaved={load} />
      <CancelExpenseModal
        expense={cancelling}
        onClose={() => setCancelling(null)}
        onSaved={load}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equity tab
// ---------------------------------------------------------------------------

function EquityTab() {
  const [checking, setChecking] = useState(true);
  const [openingPosted, setOpeningPosted] = useState(false);
  const [stockValue, setStockValue] = useState(null);
  const [error, setError] = useState('');

  const [cashAmount, setCashAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [postingOpening, setPostingOpening] = useState(false);

  const [contribution, setContribution] = useState({ amount: '', method: 'cash', date: '', notes: '' });
  const [withdrawal, setWithdrawal] = useState({ amount: '', method: 'cash', date: '', notes: '' });
  const [submittingEquity, setSubmittingEquity] = useState('');

  const load = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const [openingEntries, summary] = await Promise.all([
        api.get('/finance/journal-entries?sourceType=opening_balance&limit=1'),
        api.get('/finance/summary'),
      ]);
      setOpeningPosted(openingEntries.total > 0);
      setStockValue(summary.inventoryCheck?.stockValue ?? null);
    } catch (err) {
      setError(err.message || 'Failed to load equity data.');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function postOpening(e) {
    e.preventDefault();
    setPostingOpening(true);
    setError('');
    try {
      await api.post('/finance/opening-balances', {
        cashAmount: Number(cashAmount || 0),
        bankAmount: Number(bankAmount || 0),
      });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to post opening balances.');
    } finally {
      setPostingOpening(false);
    }
  }

  async function postEquity(kind) {
    const form = kind === 'contribution' ? contribution : withdrawal;
    setSubmittingEquity(kind);
    setError('');
    try {
      const body = { amount: Number(form.amount), method: form.method };
      if (form.date) body.date = form.date;
      if (form.notes) body.notes = form.notes;
      await api.post(kind === 'contribution' ? '/finance/owner-contributions' : '/finance/owner-withdrawals', body);
      if (kind === 'contribution') {
        setContribution({ amount: '', method: 'cash', date: '', notes: '' });
      } else {
        setWithdrawal({ amount: '', method: 'cash', date: '', notes: '' });
      }
      await load();
    } catch (err) {
      setError(err.message || 'Failed to record transaction.');
    } finally {
      setSubmittingEquity('');
    }
  }

  const inputCls =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  if (checking) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />

      {!openingPosted ? (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Post opening balances</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            This records your business's starting position: cash, bank, and current stock value (your
            stock is valued automatically at {stockValue != null ? money(stockValue) : '…'}). It can only
            be done once, so the numbers should reflect reality. Everything else builds on this starting point.
          </p>
          <form onSubmit={postOpening} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Opening cash</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Opening bank</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={postingOpening}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
              >
                {postingOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Post opening balances
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card flex items-center gap-3 p-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Opening balances are posted. Stock value at that moment was recorded into Owner's Capital.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Owner contribution</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Money you put into the business from your own pocket.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Amount *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={contribution.amount}
                onChange={(e) => setContribution((f) => ({ ...f, amount: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Into *</label>
              <select
                value={contribution.method}
                onChange={(e) => setContribution((f) => ({ ...f, method: e.target.value }))}
                className={inputCls}
              >
                <option value="cash">Cash drawer</option>
                <option value="bank_transfer">Bank account</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={contribution.date}
                onChange={(e) => setContribution((f) => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <input
                type="text"
                value={contribution.notes}
                onChange={(e) => setContribution((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <button
            onClick={() => postEquity('contribution')}
            disabled={!contribution.amount || submittingEquity === 'contribution'}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submittingEquity === 'contribution' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Record contribution
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-rose-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Owner withdrawal</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Money you take out of the business for yourself. Reduces your equity.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Amount *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={withdrawal.amount}
                onChange={(e) => setWithdrawal((f) => ({ ...f, amount: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>From *</label>
              <select
                value={withdrawal.method}
                onChange={(e) => setWithdrawal((f) => ({ ...f, method: e.target.value }))}
                className={inputCls}
              >
                <option value="cash">Cash drawer</option>
                <option value="bank_transfer">Bank account</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={withdrawal.date}
                onChange={(e) => setWithdrawal((f) => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <input
                type="text"
                value={withdrawal.notes}
                onChange={(e) => setWithdrawal((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <button
            onClick={() => postEquity('withdrawal')}
            disabled={!withdrawal.amount || submittingEquity === 'withdrawal'}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {submittingEquity === 'withdrawal' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Record withdrawal
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'journal', label: 'Journal', icon: BookOpen },
  { key: 'expenses', label: 'Expenses', icon: ArrowUpRight },
  { key: 'equity', label: 'Owner equity', icon: Scale },
];

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  async function handleExport(type, path, filename) {
    setBusy(type);
    setError('');
    try {
      await downloadFile(path, filename);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Export failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
        aria-expanded={open}
      >
        <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span>Export Statements</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-ink-900">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => handleExport('pl', '/reports/profit-loss?format=csv', 'profit-loss.csv')}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {busy === 'pl' ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            )}
            <div>
              <span className="block text-slate-900 dark:text-white">Export Profit & Loss (CSV)</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Revenue, COGS, expenses</span>
            </div>
          </button>

          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => handleExport('cf', '/reports/cash-flow?format=csv', 'cash-flow.csv')}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {busy === 'cf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-brand-500" />
            )}
            <div>
              <span className="block text-slate-900 dark:text-white">Export Cash Flow (CSV)</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Cash in & cash out</span>
            </div>
          </button>

          {error ? (
            <p className="mt-1.5 px-3 py-1 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finance"
        description="Accounts, journal entries, expenses, and owner equity — the money side of your business."
        actions={<ExportDropdown />}
      />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <OverviewTab /> : null}
      {tab === 'journal' ? <JournalTab /> : null}
      {tab === 'expenses' ? <ExpensesTab /> : null}
      {tab === 'equity' ? <EquityTab /> : null}
    </div>
  );
}