import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, Phone, User, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter your username/phone and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      showToast('Login successful!', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username or password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click demo login buttons for shop owners/staff testing
  const handleQuickLogin = (userType) => {
    if (userType === 'admin') {
      setIdentifier('admin');
      setPassword('Admin@12345');
    } else {
      setIdentifier('staff');
      setPassword('Staff@12345');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Top Language Switcher */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 font-bold text-sm shadow-md transition"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        {/* Logo & Shop Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-brand-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white mb-3">
            <Wrench className="w-10 h-10 stroke-[2.4]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            KISAN HARDWARE
          </h1>
          <p className="text-base font-semibold text-slate-500 mt-1">
            {lang === 'hi'
              ? 'दुकान बिलिंग एवं स्टॉक प्रबंधन पोर्टल'
              : 'Shop Billing & Inventory System'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-bold text-slate-700 mb-2">
              {lang === 'hi' ? 'यूजरनेम या मोबाइल नंबर' : 'Username or Mobile Number'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or 9876543210"
                required
                className="w-full pl-12 pr-4 py-3.5 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-700 mb-2">
              {lang === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-6 h-6" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3.5 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <BigButton
            type="submit"
            variant="blue"
            disabled={loading}
            icon={ArrowRight}
            className="w-full py-4 text-xl mt-2"
          >
            {loading ? t('loading') : lang === 'hi' ? 'लॉग इन करें' : 'LOG IN'}
          </BigButton>
        </form>

        {/* 1-Click Fast Demo Credentials for testing */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
            {lang === 'hi' ? 'त्वरित परीक्षण लॉगिन (Quick Test)' : 'Quick Test Login'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-sm transition text-center"
            >
              👑 Owner (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl font-bold text-sm transition text-center"
            >
              👤 Staff (Counter)
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>256-bit Encrypted Session with Auto-Logout</span>
        </div>
      </div>
    </div>
  );
};
