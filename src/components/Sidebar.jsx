import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  BarChart3,
  BellRing,
  Database,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/purchases', label: 'Purchases', icon: ShoppingBasket },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/data', label: 'Data', icon: Database },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-ink-950 text-slate-300 shadow-2xl transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <Logo className="h-9 w-9" />
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">
            CircuitStock
          </p>
          <p className="text-xs text-slate-400">Inventory Management</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'sidebar-link',
                isActive
                  ? 'bg-brand-400/10 text-brand-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs leading-5 text-slate-500">
          Tenant: {user?.tenant_id ? user.tenant_id.slice(0, 8) : 'unknown'} —{' '}
          {user?.full_name || 'not signed in'}
        </p>
      </div>
    </aside>
  );
}