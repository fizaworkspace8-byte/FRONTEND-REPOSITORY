import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RoleBadge from '../components/RoleBadge';
import { api } from '../lib/api';

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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
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
        title="Users"
        description="Manage who can access this tenant and what they can do."
      />

      <div className="grid gap-4">
        <AddUserForm roles={roles} onAdded={loadData} />

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              <thead className="bg-slate-100/60 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Name
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Role
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Last login
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge roleCode={user.role_code} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
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