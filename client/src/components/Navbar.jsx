import React from 'react';
import { Wrench, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="no-print bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Wrench className="w-8 h-8 text-white stroke-[2.3]" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block">
              KISAN HARDWARE
            </span>
            <span className="text-xs font-semibold text-blue-300 tracking-wider uppercase">
              Billing & Inventory System
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 font-bold text-base transition shadow-sm active:scale-95"
            title="भाषा बदलें / Change Language"
          >
            <Globe className="w-5 h-5" />
            <span>{lang === 'hi' ? 'English में बदलें' : 'हिंदी में देखें'}</span>
          </button>

          {/* User Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-tight">
                  {user.name}
                </div>
                <div className="text-xs text-blue-400 font-semibold uppercase">
                  {user.role === 'admin' ? t('roleAdmin') : t('roleStaff')}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-base transition shadow-sm active:scale-95"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5 stroke-[2.2]" />
              <span className="hidden md:inline">{t('logout')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
