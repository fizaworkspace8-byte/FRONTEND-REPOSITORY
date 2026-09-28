import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  PackagePlus,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';

const money = (v) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const dateTime = (v) => {
  if (!v) return 'N/A';
  return new Date(v).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Metrics State
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    salesCount: 0,
    recentSales: [],
    lowStockCount: 0,
    totalVariants: 0,
    openAlerts: 0,
    cashOnHand: 0,
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [salesResult, inventoryResult, alertsResult, financeResult] =
      await Promise.allSettled([
        api.get('/sales?limit=10'),
        api.get('/inventory/summary').catch(() => api.get('/products')),
        api.get('/alerts/open-count'),
        api.get('/finance/summary').catch(() => null),
      ]);

    let totalRev = 0;
    let sCount = 0;
    let recentSalesList = [];
    let lStock = 0;
    let tVariants = 0;
    let oAlerts = 0;
    let cCash = 0;

    // Process Sales Response
    if (salesResult.status === 'fulfilled' && salesResult.value) {
      const val = salesResult.value;
      const salesArr = val.sales || (Array.isArray(val) ? val : []);
      recentSalesList = salesArr.slice(0, 5);
      sCount = val.totalCount ?? salesArr.length;
      totalRev =
        val.totalRevenue ??
        salesArr.reduce((sum, s) => sum + Number(s.total_amount || s.total || 0), 0);
    }

    // Process Inventory Response
    if (inventoryResult.status === 'fulfilled' && inventoryResult.value) {
      const val = inventoryResult.value;
      if (val.summary) {
        tVariants = val.summary.totalVariants ?? val.summary.totalItems ?? 0;
        lStock = val.summary.lowStockCount ?? val.summary.lowStockItems ?? 0;
      } else if (val.totalVariants !== undefined || val.totalItems !== undefined) {
        tVariants = val.totalVariants ?? val.totalItems ?? 0;
        lStock = val.lowStockCount ?? val.lowStockItems ?? 0;
      } else if (val.products) {
        tVariants = val.products.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
        lStock = 0;
      }
    }

    // Process Alerts Response
    if (alertsResult.status === 'fulfilled' && alertsResult.value) {
      oAlerts = Number(alertsResult.value.openAlerts || 0);
    }

    // Process Finance Response
    if (financeResult.status === 'fulfilled' && financeResult.value) {
      cCash = Number(financeResult.value.cashOnHand || financeResult.value.cash_balance || 0);
    }

    setMetrics({
      totalRevenue: totalRev,
      salesCount: sCount,
      recentSales: recentSalesList,
      lowStockCount: lStock,
      totalVariants: tVariants,
      openAlerts: oAlerts,
      cashOnHand: cCash,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Store Dashboard"
        description="Real-time operational overview, key inventory performance metrics, and rapid transaction shortcuts."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-brand-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>System Live</span>
            </div>
          </div>
        }
      />

      {/* 4 Top Glass KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Revenue / Sales */}
        <div className="card hover-accent-emerald p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-500" /> : money(metrics.totalRevenue)}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {metrics.salesCount} Completed {metrics.salesCount === 1 ? 'Sale' : 'Sales'}
            </span>
            <Link
              to="/sales"
              className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              POS <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* KPI 2: Low Stock Items */}
        <div className="card hover-accent-amber p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Low Stock Items
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-amber-500" /> : metrics.lowStockCount}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {metrics.lowStockCount > 0 ? 'Requires Reorder' : 'Stock Levels Healthy'}
            </span>
            <Link
              to="/products"
              className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* KPI 3: Active System Alerts */}
        <div className="card hover-accent-red p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Alerts
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-red-500" /> : metrics.openAlerts}
              </h3>
            </div>
            <div className="rounded-xl bg-red-500/10 p-3 text-red-600 dark:bg-red-500/20 dark:text-red-400 shrink-0">
              <BellRing className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {metrics.openAlerts > 0 ? 'Pending Attention' : 'Zero Open Alerts'}
            </span>
            <Link
              to="/alerts"
              className="font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              Alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* KPI 4: Total Inventory Items / Variants */}
        <div className="card hover-accent-blue p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Stock Variants
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-blue-500" /> : metrics.totalVariants}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
              <Boxes className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Active SKUs</span>
            <Link
              to="/products"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              Products <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Quick Operations & Shortcuts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fast-track workflows for point-of-sale checkout, catalog edits, and reporting.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1: POS Sale */}
          <Link
            to="/sales"
            className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                New POS Sale
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Launch point-of-sale checkout</p>
            </div>
          </Link>

          {/* Action 2: Add Product */}
          <Link
            to="/products"
            className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white/50 p-4 transition-all hover:border-blue-500/40 hover:bg-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Add Product
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create new inventory SKUs</p>
            </div>
          </Link>

          {/* Action 3: View Reports */}
          <Link
            to="/reports"
            className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white/50 p-4 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 transition group-hover:bg-indigo-500 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400 shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                View Reports
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analyze sales & stock valuation</p>
            </div>
          </Link>

          {/* Action 4: Check Alerts */}
          <Link
            to="/alerts"
            className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white/50 p-4 transition-all hover:border-amber-500/40 hover:bg-amber-500/5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Check Alerts
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review low-stock notifications</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Sales Activity Preview Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Recent Sales Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest transactions recorded at the point of sale.
            </p>
          </div>
          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <span>View All Sales</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Invoice / Sale ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5 text-right">Total</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
                    <span className="mt-2 block text-xs text-slate-400">Loading recent sales...</span>
                  </td>
                </tr>
              ) : metrics.recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    No sales recorded yet. Start a sale from the POS module.
                  </td>
                </tr>
              ) : (
                metrics.recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                      {sale.invoice_number || sale.id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {sale.customer_name || sale.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {dateTime(sale.created_at || sale.sale_date)}
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">
                      {sale.payment_method || 'Cash'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                      {money(sale.total_amount || sale.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sale.status === 'completed' || !sale.status
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : sale.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {sale.status || 'Completed'}
                      </span>
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