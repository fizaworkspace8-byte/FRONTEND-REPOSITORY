import { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RoleBadge from '../components/RoleBadge';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { api } from '../lib/api';
import { dateTime } from '../lib/format';

function AddUserForm({ roles, onAdded }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/tenant/users', {
        email,
        fullName,
        password,
        roleId,
      });
      setEmail('');
      setFullName('');
      setPassword('');
      setRoleId('');
      onAdded();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        Add tenant user
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Full name
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Temporary password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Role
          </label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
          >
            <option value="">Select role…</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-60 dark:from-brand-600 dark:to-brand-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add user
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get('/tenant/users'),
        api.get('/tenant/roles'),
      ]);
      setUsers(usersData.users);
      setRoles(rolesData.roles);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage who can access this tenant and what they can do."
      />

      <div className="grid gap-4">
        <AddUserForm roles={roles} onAdded={loadData} />

      <DataTable
        columns={[
          { key: 'full_name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'role', label: 'Role', sortable: true, render: (u) => <RoleBadge roleCode={u.role_code} /> },
          { key: 'last_login_at', label: 'Last login', sortable: true, render: (u) => u.last_login_at ? dateTime(u.last_login_at) : 'Never' },
          { key: 'status', label: 'Status', render: (u) => (
            <Badge tone={u.is_active ? 'emerald' : 'slate'}>
              {u.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )},
        ]}
        rows={loading ? [] : users}
        loading={loading}
        empty="No users yet."
      />
    </div>
  </div>
  );
}