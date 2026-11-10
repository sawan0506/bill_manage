import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const navLinks = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/bills', label: t('allBills'), icon: Receipt },
    { to: '/products', label: t('inventory'), icon: Package },
    { to: '/customers', label: t('customers'), icon: Users },
    { to: '/payments', label: t('payments'), icon: CreditCard },
    ...(isAdmin ? [{ to: '/reports', label: t('reports'), icon: BarChart3 }] : []),
    { to: '/settings', label: t('settings'), icon: SettingsIcon },
    ...(isAdmin ? [{ to: '/audit', label: t('auditLogs'), icon: ShieldAlert }] : [])
  ];

  return (
    <aside className="no-print w-64 md:w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        {/* Prominent BIG NEW BILL Action Button */}
        <NavLink
          to="/new-bill"
          className={({ isActive }) =>
            `flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-xl tracking-wide shadow-lg transition-all active:scale-[0.98] ${
              isActive
                ? 'bg-emerald-800 text-white ring-4 ring-emerald-300 shadow-emerald-900/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/30'
            }`
          }
        >
          <PlusCircle className="w-7 h-7 stroke-[2.8]" />
          <span>{t('newBill')}</span>
        </NavLink>

        {/* Navigation Items List */}
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-6 h-6 flex-shrink-0 stroke-[2.2]" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Helpful info badge at bottom */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center font-medium">
        Kisan Billing v1.0 • Offline Ready
      </div>
    </aside>
  );
};
