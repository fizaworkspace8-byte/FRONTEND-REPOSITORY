import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check,
  Loader2,
  RefreshCw,
  Sparkles,
  X, BellRing } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { money, dateTime } from '../lib/format';

function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
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

function JobResultModal({ kind, result, onClose }) {
  if (!result) return null;
  const isScan = kind === 'scan';

  return (
    <Modal open onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isScan ? 'Low-stock scan complete' : 'Reorder drafts generated'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isScan ? (
        <dl className="space-y-2.5 text-sm">
          {[
            ['Variants checked', result.considered],
            ['New alerts', result.created],
            ['Refreshed', result.refreshed],
            ['Upgraded (low → out)', result.upgraded],
            ['Resolved', result.resolved],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{String(value ?? 0)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <dt className="font-semibold text-slate-900 dark:text-white">Open alerts now</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">{String(result.openAlerts ?? 0)}</dd>
          </div>
        </dl>
      ) : (
        <div className="space-y-5 text-sm">
          {(result.purchaseOrders || []).length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              No draft orders were needed — nothing below its reorder level that
              isn't already on order.
            </p>
          ) : (
            <ul className="space-y-2">
              {(result.purchaseOrders || []).map((po) => (
                <li
                  key={po.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      PO-{po.poNumber} — {po.supplierName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {po.itemCount} item{po.itemCount === 1 ? '' : 's'} · draft
                    </p>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white">{money(po.total)}</p>
                </li>
              ))}
            </ul>
          )}

          {(result.skipped || []).length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Skipped
              </p>
              <ul className="space-y-1.5">
                {(result.skipped || []).map((s, i) => (
                  <li key={i} className="flex justify-between gap-4 text-xs">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{s.sku}</span>
                    <span className="text-right text-slate-500 dark:text-slate-400">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

const STATUS_TABS = [
  { key: 'open', label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
];

export default function AlertsPage() {
  const { user } = useAuth();
  const canScan = Boolean(user?.permissions?.includes('products.write'));
  const canReorder = Boolean(user?.permissions?.includes('purchases.create'));
  const canSeeJobs = Boolean(user?.permissions?.includes('reports.read'));

  const [status, setStatus] = useState('open');
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  const [jobRuns, setJobRuns] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const limit = 25;

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/alerts?status=${status}&limit=${limit}&offset=${offset}`);
      setAlerts(res.alerts);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, [status, offset]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await api.get('/alerts/job-runs?limit=15');
      setJobRuns(res.jobRuns);
    } catch {
      setJobRuns([]);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (canSeeJobs) loadJobs();
    else setJobsLoading(false);
  }, [canSeeJobs, loadJobs]);

  async function runScan() {
    setBusy('scan');
    setError('');
    try {
      const res = await api.post('/alerts/scan');
      setResult({ kind: 'scan', result: res.result });
      await loadAlerts();
      if (canSeeJobs) await loadJobs();
    } catch (err) {
      setError(err.message || 'Scan failed.');
    } finally {
      setBusy('');
    }
  }

  async function runReorder() {
    setBusy('reorder');
    setError('');
    try {
      const res = await api.post('/alerts/reorder/generate');
      setResult({ kind: 'reorder', result: res.result });
      if (canSeeJobs) await loadJobs();
    } catch (err) {
      setError(err.message || 'Reorder generation failed.');
    } finally {
      setBusy('');
    }
  }

  async function acknowledge(id) {
    try {
      await api.post(`/alerts/${id}/acknowledge`);
      await loadAlerts();
    } catch (err) {
      setError(err.message || 'Failed to acknowledge alert.');
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={BellRing}
        title="Alerts"
        description="Low-stock and out-of-stock alerts, automatic reorder drafts, and background job history."
        actions={
          <div className="flex flex-wrap gap-2">
            {canScan ? (
              <button
                type="button"
                onClick={runScan}
                disabled={Boolean(busy)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-60 dark:from-brand-600 dark:to-brand-700"
              >
                {busy === 'scan' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Scan now
              </button>
            ) : null}
            {canReorder ? (
              <button
                type="button"
                onClick={runReorder}
                disabled={Boolean(busy)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {busy === 'reorder' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate reorder drafts
              </button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setStatus(t.key);
              setOffset(0);
            }}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              status === t.key
                ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
        <p className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {total} alert{total === 1 ? '' : 's'}
        </p>
      </div>

      <div className="card mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Product</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">On hand</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Threshold</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Alerted</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No {status === 'open' ? 'open' : status} alerts.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          a.alert_type === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {a.alert_type === 'out_of_stock' ? 'Out of stock' : 'Low stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{a.sku}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.product_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {Number(a.quantity_on_hand)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {Number(a.reorder_level)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {dateTime(a.alerted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'open' && canScan ? (
                        <button
                          type="button"
                          onClick={() => acknowledge(a.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Check className="h-3 w-3" /> Acknowledge
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

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= total || loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>

      {canSeeJobs ? (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Background job history
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Scheduled (scan every 15 min, reorder daily 06:00 server time) and manual runs.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              <thead className="bg-slate-100/60 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Job</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Trigger</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Started</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                    </td>
                  </tr>
                ) : jobRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No job runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  jobRuns.map((j) => {
                    const duration =
                      j.finished_at && j.started_at
                        ? `${Math.max(
                            1,
                            Math.round(
                              (new Date(j.finished_at) - new Date(j.started_at)) / 1000
                            )
                          )}s`
                        : '—';
                    return (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {j.job_name === 'low-stock-scan' ? 'Low-stock scan' : 'Auto-reorder'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              j.status === 'succeeded'
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300'
                                : j.status === 'failed'
                                ? 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300'
                            }`}
                          >
                            {j.status}
                          </span>
                          {j.error ? (
                            <p className="mt-1 max-w-xs truncate text-xs text-rose-600 dark:text-rose-400" title={j.error}>
                              {j.error}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.trigger_source}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{dateTime(j.started_at)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{duration}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <JobResultModal
        kind={result?.kind}
        result={result?.result}
        onClose={() => setResult(null)}
      />
    </div>
  );
}