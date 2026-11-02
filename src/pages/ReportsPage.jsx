import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarRange,
  Download,
  Loader2,
  Package,
  ShoppingBasket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { api, API_BASE_URL } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const money = (v) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const qty = (v) => {
  const n = Number(v || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const compact = (v) => {
  const n = Number(v);
  if (Math.abs(n) >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const dayLabel = (d) => String(d || '').slice(5);

const dateTime = (v) =>
  new Date(v).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOVEMENT_TYPES = [
  'opening',
  'receipt',
  'sale',
  'return',
  'adjustment',
  'damage',
  'transfer_in',
  'transfer_out',
  'count',
];

const SOURCE_LABELS = {
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

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.92)',
  color: '#f8fafc',
  fontSize: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
};

function cleanParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined && v !== null && v !== '') out[k] = String(v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// CSV download (auth-header fetch -> browser file download)
// ---------------------------------------------------------------------------

async function downloadCsv(path, params, filename) {
  const qs = new URLSearchParams({ ...cleanParams(params), format: 'csv' }).toString();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    let message = 'Export failed.';
    try {
      const body = await res.json();
      if (body && body.error && body.error.message) message = body.error.message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Report fetching hook
// ---------------------------------------------------------------------------

function useReport(path, params) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const paramKey = JSON.stringify(cleanParams(params));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ data: s.data, loading: true, error: '' }));
      try {
        const qs = new URLSearchParams(cleanParams(params)).toString();
        const data = await api.get(qs ? `${path}?${qs}` : path);
        if (!cancelled) setState({ data, loading: false, error: '' });
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: (err && err.message) || 'Failed to load report.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, paramKey]);

  return state;
}

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

function CsvButton({ path, params, filename }) {
  const { user } = useAuth();
  const canExport = Boolean(
    user && user.permissions && user.permissions.includes('reports.export')
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!canExport) return null;

  async function handleDownload() {
    setBusy(true);
    setErr('');
    try {
      await downloadCsv(path, params, filename);
    } catch (e) {
      setErr(e.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {err ? <span className="text-xs text-rose-600 dark:text-rose-400">{err}</span> : null}
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        CSV
      </button>
    </div>
  );
}

function ReportCard({ title, subtitle, csv, actions, loading, error, children }) {
  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions || null}
          {csv ? <CsvButton path={csv.path} params={csv.params} filename={csv.filename} /> : null}
        </div>
      </header>
      <div className="p-5">
        {error ? (
          <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : loading ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value, tone }) {
  const toneCls =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1.5 truncate text-xl font-bold tracking-tight ${toneCls}`}>{value}</p>
    </div>
  );
}


function ChartBox({ isEmpty, children }) {
  if (isEmpty) {
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No data for this period.
      </p>
    );
  }
  return <div className="h-64 text-slate-500 dark:text-slate-400">{children}</div>;
}

function TypeBadge({ value }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {String(value).replace(/_/g, ' ')}
    </span>
  );
}

const selectCls =
  'h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white';

// ---------------------------------------------------------------------------
// Date range bar
// ---------------------------------------------------------------------------

const PRESETS = [
  { label: 'Today', from: () => todayStr(), to: () => todayStr() },
  { label: '7 days', from: () => daysAgoStr(6), to: () => todayStr() },
  { label: '30 days', from: () => daysAgoStr(29), to: () => todayStr() },
  { label: 'This year', from: () => `${new Date().getFullYear()}-01-01`, to: () => todayStr() },
  { label: 'All time', from: () => '2020-01-01', to: () => todayStr() },
];

function DateRangeBar({ dateFrom, dateTo, onChange }) {
  return (
    <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
      <CalendarRange className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value })}
        className={selectCls}
        aria-label="From date"
      />
      <span className="text-sm text-slate-400">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onChange({ dateTo: e.target.value })}
        className={selectCls}
        aria-label="To date"
      />
      <div className="ml-auto flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange({ dateFrom: p.from(), dateTo: p.to() })}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sales tab
// ---------------------------------------------------------------------------

function SalesTab({ dateFrom, dateTo }) {
  const range = { dateFrom, dateTo };
  const summary = useReport('/reports/sales-summary', range);
  const byProduct = useReport('/reports/sales-by-product', { ...range, limit: 100 });
  const byCategory = useReport('/reports/sales-by-category', range);
  const byBrand = useReport('/reports/sales-by-brand', range);
  const byHour = useReport('/reports/sales-by-hour', range);
  const byWeekday = useReport('/reports/sales-by-weekday', range);
  const recent = useReport('/reports/recently-sold', { limit: 15 });

  const s = summary.data;
  const daily = ((s && s.daily) || []).map((d) => ({
    day: dayLabel(d.day),
    Invoiced: Number(d.totalInvoiced),
    Revenue: Number(d.netRevenue),
  }));
  const hourData = Array.from({ length: 24 }, (_, h) => {
    const found = ((byHour.data && byHour.data.byHour) || []).find(
      (x) => Number(x.hour) === h
    );
    return { hour: String(h), Sales: found ? found.sales_count : 0 };
  });
  const weekdayData = WEEKDAY_NAMES.map((name, i) => {
    const found = ((byWeekday.data && byWeekday.data.byWeekday) || []).find(
      (x) => Number(x.weekday) === i
    );
    return { name, Invoiced: found ? Number(found.total_invoiced) : 0 };
  });

  const productCols = [
    {
      key: 'product_name',
      label: 'Product',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{r.product_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{r.sku}</p>
        </div>
      ),
    },
    { key: 'category_name', label: 'Category' },
    { key: 'qty_sold', label: 'Qty', align: 'right', render: (r) => qty(r.qty_sold) },
    { key: 'net_sales', label: 'Net sales', align: 'right', render: (r) => money(r.net_sales) },
    { key: 'cogs', label: 'COGS', align: 'right', render: (r) => money(r.cogs) },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      render: (r) => (
        <span
          className={
            Number(r.profit) >= 0
              ? 'font-medium text-emerald-600 dark:text-emerald-400'
              : 'font-medium text-rose-600 dark:text-rose-400'
          }
        >
          {money(r.profit)}
        </span>
      ),
    },
    {
      key: 'margin',
      label: 'Margin',
      align: 'right',
      render: (r) =>
        Number(r.net_sales) > 0
          ? `${((Number(r.profit) / Number(r.net_sales)) * 100).toFixed(1)}%`
          : '—',
    },
  ];

  const categoryCols = [
    { key: 'category_name', label: 'Category' },
    { key: 'sales_count', label: 'Sales', align: 'right', render: (r) => String(r.sales_count) },
    { key: 'qty_sold', label: 'Qty', align: 'right', render: (r) => qty(r.qty_sold) },
    { key: 'net_sales', label: 'Net sales', align: 'right', render: (r) => money(r.net_sales) },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      render: (r) => (
        <span
          className={
            Number(r.profit) >= 0
              ? 'font-medium text-emerald-600 dark:text-emerald-400'
              : 'font-medium text-rose-600 dark:text-rose-400'
          }
        >
          {money(r.profit)}
        </span>
      ),
    },
  ];

  const recentCols = [
    { key: 'sale_number', label: 'Sale', render: (r) => `#${r.sale_number}` },
    { key: 'sale_date', label: 'Date', render: (r) => dateTime(r.sale_date) },
    { key: 'sku', label: 'SKU' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Qty', align: 'right', render: (r) => qty(r.quantity) },
    { key: 'unit_price', label: 'Price', align: 'right', render: (r) => money(r.unit_price) },
    { key: 'line_total', label: 'Total', align: 'right', render: (r) => money(r.line_total) },
  ];

  return (
    <div className="space-y-6">
      <ReportCard
        title="Sales summary"
        subtitle={`${dateFrom} → ${dateTo}`}
        csv={{ path: '/reports/sales-summary', params: range, filename: 'sales-summary' }}
        loading={summary.loading}
        error={summary.error}
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Net revenue" value={money(s?.netRevenue)} />
          <StatTile
            label="Gross profit"
            value={money(s?.grossProfit)}
            tone={Number(s?.grossProfit) >= 0 ? 'positive' : 'negative'}
          />
          <StatTile label="Sales" value={String(s?.salesCount ?? 0)} />
          <StatTile label="Items sold" value={qty(s?.itemsSold)} />
          <StatTile label="Tax collected" value={money(s?.taxCollected)} />
          <StatTile label="Outstanding" value={money(s?.outstanding)} />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Daily sales
          </p>
          <ChartBox isEmpty={daily.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                <Tooltip formatter={(v) => money(v)} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                <Bar dataKey="Invoiced" name="Invoiced" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Payment methods
          </p>
          <DataTable
            columns={[
              { key: 'method', label: 'Method', render: (r) => <TypeBadge value={r.method} /> },
              { key: 'paymentCount', label: 'Payments', align: 'right', render: (r) => String(r.paymentCount) },
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => money(r.amount) },
            ]}
            rows={(s && s.byPaymentMethod) || []}
            empty="No payments in this period."
          />
        </div>
      </ReportCard>

      <ReportCard
        title="Top products"
        subtitle="Best sellers by net sales"
        csv={{ path: '/reports/sales-by-product', params: { ...range, limit: 500 }, filename: 'sales-by-product' }}
        loading={byProduct.loading}
        error={byProduct.error}
      >
        <DataTable columns={productCols} rows={(byProduct.data && byProduct.data.products) || []} />
      </ReportCard>

      <ReportCard
        title="Sales by category"
        csv={{ path: '/reports/sales-by-category', params: range, filename: 'sales-by-category' }}
        loading={byCategory.loading}
        error={byCategory.error}
      >
        <DataTable columns={categoryCols} rows={(byCategory.data && byCategory.data.categories) || []} />
      </ReportCard>

      <ReportCard
        title="Sales by brand"
        csv={{ path: '/reports/sales-by-brand', params: range, filename: 'sales-by-brand' }}
        loading={byBrand.loading}
        error={byBrand.error}
      >
        <DataTable
          columns={[
            { key: 'brand_name', label: 'Brand' },
            { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue || 0) },
            { key: 'units_sold', label: 'Units Sold', align: 'right', render: (r) => qty(r.units_sold || 0) },
          ]}
          rows={(byBrand.data && byBrand.data.brands) || []}
          empty="No brand sales recorded yet."
        />
      </ReportCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard
          title="Busiest hours"
          subtitle="Sales count by hour of day (tenant timezone)"
          loading={byHour.loading}
          error={byHour.error}
        >
          <ChartBox isEmpty={hourData.every((h) => h.Sales === 0)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                <Bar dataKey="Sales" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </ReportCard>

        <ReportCard
          title="Sales by weekday"
          subtitle="Invoiced amount by day of week"
          loading={byWeekday.loading}
          error={byWeekday.error}
        >
          <ChartBox isEmpty={weekdayData.every((d) => d.Invoiced === 0)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                <Tooltip formatter={(v) => money(v)} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                <Bar dataKey="Invoiced" name="Invoiced" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </ReportCard>
      </div>

      <ReportCard
        title="Recently sold"
        subtitle="Latest posted sale lines"
        csv={{ path: '/reports/recently-sold', params: { limit: 500 }, filename: 'recently-sold' }}
        loading={recent.loading}
        error={recent.error}
      >
        <DataTable columns={recentCols} rows={(recent.data && recent.data.recent) || []} />
      </ReportCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory tab
// ---------------------------------------------------------------------------

function InventoryTab({ dateFrom, dateTo }) {
  const valuation = useReport('/reports/inventory-valuation', { limit: 200 });
  const low = useReport('/reports/low-stock', {});
  const [mvType, setMvType] = useState('');
  const [mvOffset, setMvOffset] = useState(0);
  const movements = useReport('/reports/stock-movements', {
    dateFrom,
    dateTo,
    type: mvType,
    limit: 25,
    offset: mvOffset,
  });
  const [nmDays, setNmDays] = useState(90);
  const nonMoving = useReport('/reports/non-moving', { days: nmDays, limit: 200 });

  const v = valuation.data;
  const mvTotal = (movements.data && movements.data.total) || 0;

  return (
    <div className="space-y-6">
      <ReportCard
        title="Inventory valuation"
        subtitle="Stock on hand at moving weighted average cost"
        csv={{ path: '/reports/inventory-valuation', params: { limit: 500 }, filename: 'inventory-valuation' }}
        loading={valuation.loading}
        error={valuation.error}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Variants with stock" value={String(v?.totals?.variantsWithStock ?? 0)} />
          <StatTile label="Units on hand" value={qty(v?.totals?.totalQty)} />
          <StatTile label="Cost value" value={money(v?.totals?.totalCostValue)} />
          <StatTile label="Retail value" value={money(v?.totals?.totalRetailValue)} />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            By category
          </p>
          <DataTable
            columns={[
              { key: 'category_name', label: 'Category' },
              { key: 'variants', label: 'Variants', align: 'right', render: (r) => String(r.variants) },
              { key: 'qty', label: 'Qty', align: 'right', render: (r) => qty(r.qty) },
              { key: 'cost_value', label: 'Cost value', align: 'right', render: (r) => money(r.cost_value) },
            ]}
            rows={(v && v.byCategory) || []}
            empty="No stock on hand."
          />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Items
          </p>
          <DataTable
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'product_name', label: 'Product' },
              { key: 'category_name', label: 'Category' },
              { key: 'qty', label: 'Qty', align: 'right', render: (r) => qty(r.qty) },
              { key: 'average_cost', label: 'Avg cost', align: 'right', render: (r) => money(r.average_cost) },
              { key: 'cost_value', label: 'Cost value', align: 'right', render: (r) => money(r.cost_value) },
              { key: 'retail_value', label: 'Retail value', align: 'right', render: (r) => money(r.retail_value) },
            ]}
            rows={(v && v.items) || []}
            empty="No stock on hand."
          />
        </div>
      </ReportCard>

      <ReportCard
        title="Low & out of stock"
        csv={{ path: '/reports/low-stock', params: {}, filename: 'low-stock' }}
        loading={low.loading}
        error={low.error}
      >
        <DataTable
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'product_name', label: 'Product' },
            { key: 'qty_on_hand', label: 'On hand', align: 'right', render: (r) => qty(r.qty_on_hand) },
            { key: 'reorder_level', label: 'Reorder at', align: 'right', render: (r) => qty(r.reorder_level) },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === 'out_of_stock'
                      ? 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300'
                  }`}
                >
                  {r.status === 'out_of_stock' ? 'Out of stock' : 'Low stock'}
                </span>
              ),
            },
            { key: 'preferred_supplier', label: 'Preferred supplier' },
          ]}
          rows={(low.data && low.data.items) || []}
          empty="No items at or below their reorder level."
        />
      </ReportCard>

      <ReportCard
        title="Stock movements"
        subtitle="Full audit history from the movement ledger"
        actions={
          <select
            value={mvType}
            onChange={(e) => {
              setMvType(e.target.value);
              setMvOffset(0);
            }}
            className={selectCls}
            aria-label="Filter by movement type"
          >
            <option value="">All types</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        }
        csv={{
          path: '/reports/stock-movements',
          params: { dateFrom, dateTo, type: mvType, limit: 500 },
          filename: 'stock-movements',
        }}
        loading={movements.loading}
        error={movements.error}
      >
        <DataTable
          columns={[
            { key: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) },
            { key: 'movement_type', label: 'Type', render: (r) => <TypeBadge value={r.movement_type} /> },
            { key: 'sku', label: 'SKU' },
            { key: 'product_name', label: 'Product' },
            { key: 'location_name', label: 'Location' },
            {
              key: 'quantity_change',
              label: 'Change',
              align: 'right',
              render: (r) => (
                <span
                  className={
                    Number(r.quantity_change) > 0
                      ? 'font-medium text-emerald-600 dark:text-emerald-400'
                      : 'font-medium text-rose-600 dark:text-rose-400'
                  }
                >
                  {Number(r.quantity_change) > 0 ? '+' : ''}
                  {qty(r.quantity_change)}
                </span>
              ),
            },
            { key: 'unit_cost', label: 'Unit cost', align: 'right', render: (r) => money(r.unit_cost) },
            { key: 'notes', label: 'Notes' },
          ]}
          rows={(movements.data && movements.data.movements) || []}
          empty="No movements in this period."
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mvTotal === 0
              ? 'No movements'
              : `${mvOffset + 1}–${Math.min(mvOffset + 25, mvTotal)} of ${mvTotal}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMvOffset(Math.max(0, mvOffset - 25))}
              disabled={mvOffset === 0 || movements.loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setMvOffset(mvOffset + 25)}
              disabled={mvOffset + 25 >= mvTotal || movements.loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </ReportCard>

      <ReportCard
        title="Non-moving stock"
        subtitle="In-stock items with no posted sales in the selected window"
        actions={
          <select
            value={nmDays}
            onChange={(e) => setNmDays(Number(e.target.value))}
            className={selectCls}
            aria-label="Non-moving window"
          >
            {[30, 60, 90, 180].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        }
        csv={{ path: '/reports/non-moving', params: { days: nmDays, limit: 500 }, filename: 'non-moving-stock' }}
        loading={nonMoving.loading}
        error={nonMoving.error}
      >
        <DataTable
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'product_name', label: 'Product' },
            { key: 'qty_on_hand', label: 'On hand', align: 'right', render: (r) => qty(r.qty_on_hand) },
            { key: 'average_cost', label: 'Avg cost', align: 'right', render: (r) => money(r.average_cost) },
            { key: 'stock_value', label: 'Stock value', align: 'right', render: (r) => money(r.stock_value) },
          ]}
          rows={(nonMoving.data && nonMoving.data.products) || []}
          empty="No non-moving stock — everything with stock has sold recently."
        />
      </ReportCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purchases tab
// ---------------------------------------------------------------------------

function PurchasesTab({ dateFrom, dateTo }) {
  const range = { dateFrom, dateTo };
  const pv = useReport('/reports/purchase-vs-sale', { ...range, limit: 100 });
  const ph = useReport('/reports/price-history', { limit: 100 });
  const supBal = useReport('/reports/supplier-balances', {});
  const supCredits = useReport('/reports/supplier-credits', {});
  const payAging = useReport('/reports/payables-aging', {});

  return (
    <div className="space-y-6">
      <ReportCard
        title="Purchase vs sale rates"
        subtitle="Average received cost vs average sold price per product"
        csv={{ path: '/reports/purchase-vs-sale', params: { ...range, limit: 500 }, filename: 'purchase-vs-sale' }}
        loading={pv.loading}
        error={pv.error}
      >
        <DataTable
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'product_name', label: 'Product' },
            { key: 'qty_received', label: 'Received', align: 'right', render: (r) => qty(r.qty_received) },
            { key: 'avg_purchase_cost', label: 'Avg purchase', align: 'right', render: (r) => money(r.avg_purchase_cost) },
            { key: 'qty_sold', label: 'Sold', align: 'right', render: (r) => qty(r.qty_sold) },
            { key: 'avg_selling_price', label: 'Avg selling', align: 'right', render: (r) => money(r.avg_selling_price) },
            {
              key: 'margin_pct',
              label: 'Margin',
              align: 'right',
              render: (r) =>
                r.margin_pct == null ? (
                  '—'
                ) : (
                  <span
                    className={
                      Number(r.margin_pct) >= 0
                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                        : 'font-medium text-rose-600 dark:text-rose-400'
                    }
                  >
                    {Number(r.margin_pct).toFixed(1)}%
                  </span>
                ),
            },
          ]}
          rows={(pv.data && pv.data.items) || []}
          empty="No purchases or sales in this period."
        />
      </ReportCard>

      <ReportCard
        title="Price history"
        subtitle="Most recent purchase costs and sale prices"
        csv={{ path: '/reports/price-history', params: { limit: 500 }, filename: 'price-history' }}
        loading={ph.loading}
        error={ph.error}
      >
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: (r) => dateTime(r.date) },
            { key: 'kind', label: 'Type', render: (r) => <TypeBadge value={r.kind} /> },
            { key: 'sku', label: 'SKU' },
            { key: 'product_name', label: 'Product' },
            { key: 'quantity', label: 'Qty', align: 'right', render: (r) => qty(r.quantity) },
            { key: 'price', label: 'Price', align: 'right', render: (r) => money(r.price) },
          ]}
          rows={(ph.data && ph.data.history) || []}
          empty="No purchase or sale price history yet."
        />
      </ReportCard>

      <ReportCard
        title="Supplier balances"
        subtitle="What you owe suppliers vs what they owe you"
        csv={{ path: '/reports/supplier-balances', params: {}, filename: 'supplier-balances' }}
        loading={supBal.loading}
        error={supBal.error}
      >
        <DataTable
          columns={[
            { key: 'supplier_name', label: 'Supplier' },
            { key: 'bills_count', label: 'Open bills', align: 'right', render: (r) => String(r.bills_count) },
            { key: 'bills_outstanding', label: 'You owe', align: 'right', render: (r) => money(r.bills_outstanding) },
            { key: 'supplier_credits', label: 'They owe', align: 'right', render: (r) => money(r.supplier_credits) },
            {
              key: 'net_position',
              label: 'Net position',
              align: 'right',
              render: (r) => (
                <span
                  className={
                    Number(r.net_position) >= 0
                      ? 'font-medium text-slate-900 dark:text-white'
                      : 'font-medium text-rose-600 dark:text-rose-400'
                  }
                >
                  {money(r.net_position)}
                </span>
              ),
            },
          ]}
          rows={(supBal.data && supBal.data.suppliers) || []}
          empty="No suppliers yet."
        />
      </ReportCard>

      <ReportCard
        title="Payables aging"
        subtitle="Outstanding supplier bills by age"
        csv={{ path: '/reports/payables-aging', params: {}, filename: 'payables-aging' }}
        loading={payAging.loading}
        error={payAging.error}
      >
        <DataTable
          columns={[
            { key: 'supplier_name', label: 'Supplier' },
            { key: 'open_bills', label: 'Bills', align: 'right', render: (r) => String(r.open_bills) },
            { key: 'total_outstanding', label: 'Total', align: 'right', render: (r) => money(r.total_outstanding) },
            { key: 'current', label: 'Current', align: 'right', render: (r) => money(r.current) },
            { key: 'days_31_60', label: '31–60', align: 'right', render: (r) => money(r.days_31_60) },
            { key: 'days_61_90', label: '61–90', align: 'right', render: (r) => money(r.days_61_90) },
            { key: 'over_90', label: 'Over 90', align: 'right', render: (r) => money(r.over_90) },
          ]}
          rows={(payAging.data && payAging.data.suppliers) || []}
          empty="No outstanding supplier bills."
        />
      </ReportCard>

      <ReportCard
        title="Supplier credits"
        subtitle="Refunds owed to you from purchase returns"
        csv={{ path: '/reports/supplier-credits', params: {}, filename: 'supplier-credits' }}
        loading={supCredits.loading}
        error={supCredits.error}
      >
        <DataTable
          columns={[
            { key: 'supplier_name', label: 'Supplier' },
            { key: 'returns_count', label: 'Returns', align: 'right', render: (r) => String(r.returns_count) },
            { key: 'credit_value', label: 'Credit value', align: 'right', render: (r) => money(r.credit_value) },
          ]}
          rows={(supCredits.data && supCredits.data.suppliers) || []}
          empty="No purchase returns recorded."
        />
      </ReportCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial tab
// ---------------------------------------------------------------------------

function PlLine({ label, amount, bold, tone }) {
  const amountCls =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        bold ? 'mt-2 border-t border-slate-100 pt-2 dark:border-slate-800' : ''
      }`}
    >
      <span
        className={
          bold ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
        }
      >
        {label}
      </span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : 'font-medium'} ${amountCls}`}>
        {amount}
      </span>
    </div>
  );
}

function FinancialTab({ dateFrom, dateTo }) {
  const range = { dateFrom, dateTo };
  const pl = useReport('/reports/profit-loss', range);
  const cf = useReport('/reports/cash-flow', range);
  const ar = useReport('/reports/receivables-aging', {});
  const custBal = useReport('/reports/customer-balances', {});
  const custCredits = useReport('/reports/customer-credits', {});
  const exp = useReport('/reports/expenses-summary', range);

  const p = pl.data;
  const c = cf.data;
  const cfDaily = ((c && c.byDay) || []).map((x) => ({
    day: dayLabel(x.day),
    In: Number(x.moneyIn),
    Out: Number(x.moneyOut),
  }));

  return (
    <div className="space-y-6">
      <ReportCard
        title="Profit & loss"
        subtitle={`${dateFrom} → ${dateTo}`}
        csv={{ path: '/reports/profit-loss', params: range, filename: 'profit-loss' }}
        loading={pl.loading}
        error={pl.error}
      >
        <div className="space-y-1.5 text-sm">
          <PlLine label="Net sales revenue" amount={money(p?.netRevenue)} />
          <PlLine label="Cost of goods sold" amount={`(${money(p?.cogs)})`} />
          <PlLine label="Gross profit" amount={money(p?.grossProfit)} bold />
          {((p && p.operatingExpenses) || []).map((x) => (
            <PlLine key={x.code} label={`${x.code} — ${x.name}`} amount={`(${money(x.amount)})`} />
          ))}
          {((p && p.otherIncome) || []).map((x) => (
            <PlLine key={x.code} label={`${x.code} — ${x.name}`} amount={money(x.amount)} />
          ))}
          <PlLine
            label="Net profit"
            amount={money(p?.netProfit)}
            bold
            tone={Number(p?.netProfit) >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </ReportCard>

      <ReportCard
        title="Cash flow"
        subtitle="Cash on hand + bank account movements"
        csv={{ path: '/reports/cash-flow', params: range, filename: 'cash-flow' }}
        loading={cf.loading}
        error={cf.error}
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Opening balance" value={money(c?.openingBalance)} />
          <StatTile label="Money in" value={money(c?.totalIn)} tone="positive" />
          <StatTile label="Money out" value={money(c?.totalOut)} tone="negative" />
          <StatTile
            label="Net change"
            value={money(c?.netChange)}
            tone={Number(c?.netChange) >= 0 ? 'positive' : 'negative'}
          />
          <StatTile label="Closing balance" value={money(c?.closingBalance)} />
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Daily movement
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Money in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                Money out
              </span>
            </div>
          </div>
          <ChartBox isEmpty={cfDaily.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                <Tooltip formatter={(v) => money(v)} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                <Bar dataKey="In" name="Money in" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Out" name="Money out" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            By source
          </p>
          <DataTable
            columns={[
              {
                key: 'sourceType',
                label: 'Source',
                render: (r) => SOURCE_LABELS[r.sourceType] || r.sourceType,
              },
              { key: 'moneyIn', label: 'Money in', align: 'right', render: (r) => money(r.moneyIn) },
              { key: 'moneyOut', label: 'Money out', align: 'right', render: (r) => money(r.moneyOut) },
              {
                key: 'net',
                label: 'Net',
                align: 'right',
                render: (r) => (
                  <span
                    className={
                      Number(r.net) >= 0
                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                        : 'font-medium text-rose-600 dark:text-rose-400'
                    }
                  >
                    {money(r.net)}
                  </span>
                ),
              },
            ]}
            rows={(c && c.bySource) || []}
            empty="No cash movements in this period."
          />
        </div>
      </ReportCard>

      <ReportCard
        title="Receivables aging"
        subtitle="Outstanding customer balances by invoice age"
        csv={{ path: '/reports/receivables-aging', params: {}, filename: 'receivables-aging' }}
        loading={ar.loading}
        error={ar.error}
      >
        <DataTable
          columns={[
            { key: 'customer_name', label: 'Customer' },
            { key: 'open_invoices', label: 'Invoices', align: 'right', render: (r) => String(r.open_invoices) },
            { key: 'total_outstanding', label: 'Total', align: 'right', render: (r) => money(r.total_outstanding) },
            { key: 'current', label: 'Current', align: 'right', render: (r) => money(r.current) },
            { key: 'days_31_60', label: '31–60', align: 'right', render: (r) => money(r.days_31_60) },
            { key: 'days_61_90', label: '61–90', align: 'right', render: (r) => money(r.days_61_90) },
            { key: 'over_90', label: 'Over 90', align: 'right', render: (r) => money(r.over_90) },
          ]}
          rows={(ar.data && ar.data.customers) || []}
          empty="No outstanding customer balances."
        />
      </ReportCard>

      <ReportCard
        title="Customer balances"
        csv={{ path: '/reports/customer-balances', params: {}, filename: 'customer-balances' }}
        loading={custBal.loading}
        error={custBal.error}
      >
        <DataTable
          columns={[
            { key: 'customer_name', label: 'Customer' },
            { key: 'sales_count', label: 'Sales', align: 'right', render: (r) => String(r.sales_count) },
            { key: 'lifetime_total', label: 'Lifetime total', align: 'right', render: (r) => money(r.lifetime_total) },
            {
              key: 'outstanding',
              label: 'Outstanding',
              align: 'right',
              render: (r) => (
                <span
                  className={
                    Number(r.outstanding) > 0
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }
                >
                  {money(r.outstanding)}
                </span>
              ),
            },
          ]}
          rows={(custBal.data && custBal.data.customers) || []}
          empty="No customers yet."
        />
      </ReportCard>

      <ReportCard
        title="Customer credits"
        subtitle="Money you owe customers from cancelled paid sales"
        csv={{ path: '/reports/customer-credits', params: {}, filename: 'customer-credits' }}
        loading={custCredits.loading}
        error={custCredits.error}
      >
        <DataTable
          columns={[
            { key: 'customer_name', label: 'Customer' },
            {
              key: 'cancelled_paid_sales',
              label: 'Cancelled paid sales',
              align: 'right',
              render: (r) => String(r.cancelled_paid_sales),
            },
            { key: 'credit_owed', label: 'Credit owed', align: 'right', render: (r) => money(r.credit_owed) },
          ]}
          rows={(custCredits.data && custCredits.data.customers) || []}
          empty="No customer credits outstanding."
        />
      </ReportCard>

      <ReportCard
        title="Expenses by category"
        subtitle={`${dateFrom} → ${dateTo}`}
        csv={{ path: '/reports/expenses-summary', params: range, filename: 'expenses-summary' }}
        loading={exp.loading}
        error={exp.error}
      >
        <DataTable
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Category' },
            { key: 'expenseCount', label: 'Entries', align: 'right', render: (r) => String(r.expenseCount) },
            { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
          ]}
          rows={(exp.data && exp.data.byCategory) || []}
          empty="No expenses recorded in this period."
        />
        {exp.data && (exp.data.byCategory || []).length > 0 ? (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-white">Total expenses</span>
            <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {money(exp.data.grandTotal)}
            </span>
          </div>
        ) : null}
      </ReportCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'purchases', label: 'Purchases & suppliers', icon: ShoppingBasket },
  { key: 'financial', label: 'Financial', icon: Wallet },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const canRead = Boolean(
    user && user.permissions && user.permissions.includes('reports.read')
  );

  const [tab, setTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState(daysAgoStr(29));
  const [dateTo, setDateTo] = useState(todayStr());

  if (!canRead) {
    return (
      <div className="animate-fade-up">
        <PageHeader
        icon={TrendingUp}
          title="Reports"
          description="Sales, inventory, purchasing and financial reporting."
        />
        <div className="card p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your role does not include permission to view reports.
          </p>
        </div>
      </div>
    );
  }

  function handleRangeChange(next) {
    if (next.dateFrom !== undefined) setDateFrom(next.dateFrom);
    if (next.dateTo !== undefined) setDateTo(next.dateTo);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Reports"
        description="Sales, inventory, purchasing and financial reporting — with CSV export on every table."
      />

      <DateRangeBar dateFrom={dateFrom} dateTo={dateTo} onChange={handleRangeChange} />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
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

      {tab === 'sales' ? <SalesTab dateFrom={dateFrom} dateTo={dateTo} /> : null}
      {tab === 'inventory' ? <InventoryTab dateFrom={dateFrom} dateTo={dateTo} /> : null}
      {tab === 'purchases' ? <PurchasesTab dateFrom={dateFrom} dateTo={dateTo} /> : null}
      {tab === 'financial' ? <FinancialTab dateFrom={dateFrom} dateTo={dateTo} /> : null}
    </div>
  );
}