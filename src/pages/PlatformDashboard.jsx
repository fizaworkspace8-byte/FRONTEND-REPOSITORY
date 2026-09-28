import { useEffect, useState } from 'react';
import { Building, Loader2, Plus, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';

function CreateTenantForm({ onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxName, setTaxName] = useState('Tax');
  const [taxRate, setTaxRate] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/platform/tenants', {
        name,
        slug,
        ownerEmail,
        ownerPassword,
        ownerFullName,
        currencyCode,
        timezone,
        taxName,
        taxRate: Number(taxRate),
      });
      setName('');
      setSlug('');
      setOwnerEmail('');
      setOwnerPassword('');
      setOwnerFullName('');
      setCurrencyCode('USD');
      setTimezone('UTC');
      setTaxName('Tax');
      setTaxRate('0');
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create tenant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        Create new tenant
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Creates the tenant, default roles, and the first owner user.
      </p>

      <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Business name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Slug (lowercase, hyphens)
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-electronics"
            required
            pattern="[a-z0-9-]+"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Owner email
          </label>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Owner full name
          </label>
          <input
            value={ownerFullName}
            onChange={(e) => setOwnerFullName(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Owner temporary password
          </label>
          <input
            type="password"
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
            required
            minLength={8}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Currency
            </label>
            <input
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
              maxLength={3}
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Timezone
            </label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Tax name
            </label>
            <input
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Tax rate %
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {error ? (
          <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create tenant
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PlatformDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTenants() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/platform/tenants');
      setTenants(data.tenants);
    } catch (err) {
      setError(err.message || 'Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tenants"
        description="Create and monitor tenant businesses. Each tenant is isolated from every other."
        actions={
          <button
            type="button"
            onClick={loadTenants}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4">
        <CreateTenantForm onCreated={loadTenants} />

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                    Currency
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                    Users
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-rose-600">
                      {error}
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No tenants yet.
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          {tenant.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tenant.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tenant.currency_code || 'USD'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tenant.user_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            tenant.status === 'active'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-900 dark:bg-slate-400/10 dark:text-slate-300'
                          }`}
                        >
                          {tenant.status}
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
    </div>
  );
}