import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Info,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Coins,
  Percent,
  Clock,
  Lock,
  Server,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Tag,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RoleBadge from '../components/RoleBadge';
import { api, API_BASE_URL } from '../lib/api';

const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'PKR', label: 'PKR (₨) - Pakistani Rupee' },
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'AED', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'SAR', label: 'SAR (﷼) - Saudi Riyal' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { code: 'CNY', label: 'CNY (¥) - Chinese Yuan' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST / EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST / CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST / MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST / PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT / BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET / CEST)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST / AEDT)' },
];

const SYSTEM_ROLES = [
  {
    code: 'owner',
    name: 'Organization Owner',
    description:
      'Full administrative authority over tenant organization, billing, system configuration, user access, and security policies.',
    permissions: [
      'Full System Access (*)',
      'Tenant Settings Write',
      'User Provisioning',
      'Financial Management',
      'Audit Log Review',
    ],
  },
  {
    code: 'admin',
    name: 'Administrator',
    description:
      'Day-to-day managerial access to oversee inventory catalogs, staff accounts, sales operations, purchase orders, and business reports.',
    permissions: [
      'User Management',
      'Catalog & Pricing Write',
      'Sales & Purchases Write',
      'Financial Overview',
      'Stock Alerting',
    ],
  },
  {
    code: 'cashier',
    name: 'Cashier / POS Operator',
    description:
      'Front-line point-of-sale operator specialized in recording retail transactions, processing customer payments, and issuing sales receipts.',
    permissions: [
      'Create Sales Orders',
      'Read Product Catalog',
      'Apply Order Discounts',
      'Print Customer Invoices',
    ],
  },
  {
    code: 'inventory_manager',
    name: 'Inventory Manager',
    description:
      'Catalog and procurement specialist managing stock levels, reorder thresholds, supplier purchase orders, and stock adjustments.',
    permissions: [
      'Manage Catalog Items',
      'Create & Receive Purchases',
      'Adjust Stock Quantities',
      'Manage Low-Stock Alerts',
    ],
  },
  {
    code: 'accountant',
    name: 'Accountant',
    description:
      'Financial specialist monitoring accounting ledgers, income and expense records, tax compliance, cash flows, and profitability reports.',
    permissions: [
      'Financial Ledger Access',
      'Tax & Expense Records',
      'Invoice Review',
      'Read Sales & Purchases Data',
    ],
  },
  {
    code: 'auditor',
    name: 'Compliance Auditor',
    description:
      'Read-only inspector for external or internal compliance to review historical logs, inventory valuations, and financial records.',
    permissions: [
      'Read-Only All Records',
      'Audit Trail Logs',
      'Export System Reports',
      'Stock Reconciliation View',
    ],
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business');

  // Business & Taxes Form State
  const [businessName, setBusinessName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxName, setTaxName] = useState('VAT');
  const [taxRate, setTaxRate] = useState(0);

  // Initial fetch states
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form submit states
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // System Info UI state
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/tenant/settings');
      const data = res?.settings || res?.tenant || res || {};

      setBusinessName(data.businessName ?? data.business_name ?? data.name ?? '');
      setCurrencyCode(data.currencyCode ?? data.currency_code ?? data.currency ?? 'USD');
      setTimezone(data.timezone ?? data.time_zone ?? 'UTC');
      setTaxName(data.taxName ?? data.tax_name ?? 'VAT');
      setTaxRate(data.taxRate ?? data.tax_rate ?? 0);
    } catch (err) {
      setFetchError(err.message || 'Failed to load tenant settings from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSuccessMessage('');

    try {
      const payload = {
        businessName: businessName.trim(),
        currencyCode,
        timezone,
        taxName: taxName.trim(),
        taxRate: Number(taxRate) || 0,
      };

      const res = await api.patch('/tenant/settings', payload);
      const updated = res?.settings || res?.tenant || res || {};

      // Sync state with returned payload if present
      if (updated.businessName || updated.business_name) {
        setBusinessName(updated.businessName ?? updated.business_name);
      }
      if (updated.currencyCode || updated.currency_code) {
        setCurrencyCode(updated.currencyCode ?? updated.currency_code);
      }
      if (updated.timezone || updated.time_zone) {
        setTimezone(updated.timezone ?? updated.time_zone);
      }
      if (updated.taxName || updated.tax_name) {
        setTaxName(updated.taxName ?? updated.tax_name);
      }
      if (updated.taxRate !== undefined || updated.tax_rate !== undefined) {
        setTaxRate(updated.taxRate ?? updated.tax_rate);
      }

      setSuccessMessage('Business & tax settings saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  }

  function handleCopyApiUrl() {
    navigator.clipboard.writeText(API_BASE_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Business Settings"
        description="Manage business profile, taxes, currency, timezone, and review system roles."
      />

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`group inline-flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'business'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Business & Taxes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`group inline-flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Roles & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`group inline-flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>System Info</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: Business & Taxes */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {loading ? (
            <div className="card p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading tenant business settings...
              </p>
            </div>
          ) : fetchError ? (
            <div className="card border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 dark:text-rose-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                    Unable to load settings
                  </h3>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{fetchError}</p>
                  <button
                    type="button"
                    onClick={fetchSettings}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry Loading
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="card divide-y divide-slate-100 dark:divide-slate-800">
              {/* Header section */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      General Business Profile & Taxes
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Configure your enterprise identity, base trading currency, timezone, and tax configuration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSettings}
                    title="Reload current settings"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Banners */}
                {successMessage && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300 animate-fade-up">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {saveError && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 dark:text-rose-300 animate-fade-up">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 dark:text-rose-400" />
                    <span>{saveError}</span>
                  </div>
                )}
              </div>

              {/* Form Fields Body */}
              <div className="p-6 grid gap-6 md:grid-cols-2">
                {/* Business Name */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Business / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={saving}
                    placeholder="e.g. CircuitStock Accessories Ltd."
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-4 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Appears on customer invoices, sales receipts, and purchase orders.
                  </p>
                </div>

                {/* Currency Code */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Coins className="h-3.5 w-3.5 text-slate-400" />
                    Base Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    required
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Used for catalog prices, financial ledgers, and transaction reporting.
                  </p>
                </div>

                {/* Timezone */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Operational Timezone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    required
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Determines reporting cutoffs and date timestamps across sales and audit logs.
                  </p>
                </div>

                {/* Tax Name */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    Tax Label / Name
                  </label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    disabled={saving}
                    placeholder="e.g. VAT, Sales Tax, GST"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-4 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Label displayed on customer checkouts and tax summary reports.
                  </p>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Percent className="h-3.5 w-3.5 text-slate-400" />
                    Default Tax Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={saving}
                    placeholder="15.00"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-4 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Percentage applied to taxable POS checkout items (0.00 to 100.00%).
                  </p>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 bg-slate-50/50 p-6 dark:bg-slate-900/30">
                <button
                  type="submit"
                  disabled={saving || !businessName.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-brand-400 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Business Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: Roles & Security */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Information Notice Banner */}
          <div className="card p-6 bg-gradient-to-r from-ink-950 to-ink-900 text-white dark:from-ink-900 dark:to-ink-800">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-brand-400/20 p-3 text-brand-300 shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  System Roles & Access Control Matrix
                </h2>
                <p className="mt-1 text-sm text-slate-300 max-w-3xl leading-relaxed">
                  CircuitStock utilizes system-defined, fine-grained role-based access control (RBAC). 
                  Roles enforce strict multi-tenant isolation, tenant security compliance, and feature entitlement across all POS and inventory endpoints.
                </p>
              </div>
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {SYSTEM_ROLES.map((role) => (
              <div
                key={role.code}
                className="card p-6 flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {role.name}
                    </h3>
                    <RoleBadge roleCode={role.code} />
                  </div>

                  <div className="mt-2 font-mono text-xs text-slate-400 dark:text-slate-500">
                    Role Code: <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 dark:text-slate-300">{role.code}</span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                    {role.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Key Entitlements
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: System Info */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    CircuitStock Inventory Infrastructure
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Client application environment runtime and API connectivity details.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                Operational
              </span>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Application Details */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Smartphone className="h-4 w-4 text-brand-500" />
                  Application Metadata
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Application Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">CircuitStock Inventory</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Frontend Build:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">v0.1.0 (Phase 11)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Engine / Runtime:</span>
                    <span className="font-medium text-slate-900 dark:text-white">React 18 + Vite 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Styling System:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Tailwind CSS (Dark Mode Ready)</span>
                  </div>
                </div>
              </div>

              {/* API Integration */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-brand-500" />
                    API Connectivity
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyApiUrl}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-slate-600 border border-slate-200 transition hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Base URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">Base Endpoint:</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 block">
                      {API_BASE_URL}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Auth Token Transport:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Bearer JWT (localStorage)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Isolation Layer:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Tenant ID Scope</span>
                  </div>
                </div>
              </div>

              {/* PWA & Service Worker */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3 md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Smartphone className="h-4 w-4 text-brand-500" />
                  PWA & Offline Capability Status
                </div>
                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                  <div className="rounded-lg bg-white p-3 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Service Worker</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="h-4 w-4" /> Active (sw.js)
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-3 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Precache Status</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-1">
                      15 Assets Cached
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-3 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Web App Manifest</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-1">
                      manifest.webmanifest
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
