import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  FileSpreadsheet,
  Lock,
  Users,
  ShieldCheck,
  CheckCircle,
  Save,
  Plus,
  UserX,
  UserCheck
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';

export const Settings = () => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState('shop'); // 'shop', 'tax', 'password', 'staff'
  const [loading, setLoading] = useState(false);

  // Shop Settings Form
  const [shopSettings, setShopSettings] = useState({
    shopName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    state: 'Delhi',
    invoicePrefix: 'INV',
    enableGst: true,
    defaultGstRate: 18,
    termsAndConditions: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Staff Management State
  const [usersList, setUsersList] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.success) {
        setShopSettings(res.data.data);
      }
    });

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', shopSettings);
      if (res.data.success) {
        showToast('Shop details saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        showToast('Password changed successfully!', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/users', newStaff);
      if (res.data.success) {
        showToast('Staff account created successfully', 'success');
        setShowAddStaff(false);
        setNewStaff({ name: '', username: '', phone: '', password: '', role: 'staff' });
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create staff', 'error');
    }
  };

  const handleToggleUser = async (user) => {
    try {
      const res = await api.patch(`/auth/users/${user._id}/toggle`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle user', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-brand-600 stroke-[2.3]" />
          <span>{t('settings')}</span>
        </h1>
        <p className="text-base text-slate-500 font-medium mt-1">
          {lang === 'hi'
            ? 'दुकान की जानकारी, बिल फॉर्मेट, जीएसटी दरें, यूपीआई आईडी और पासवर्ड बदलें'
            : 'Configure shop details, invoice prefix, GST rates, bank UPI and security'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'shop', label: 'Shop Details & Bank', icon: Store },
          { id: 'password', label: 'Change Password', icon: Lock },
          ...(isAdmin ? [{ id: 'staff', label: 'Staff Accounts', icon: Users }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-lg whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2.2]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Shop & Bank Details */}
      {activeSection === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 border-b pb-3">
            Shop Information (दुकान का विवरण)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                required
                value={shopSettings.shopName}
                onChange={(e) => setShopSettings({ ...shopSettings, shopName: e.target.value })}
                className="w-full px-4 py-3 text-lg font-bold border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.tagline}
                onChange={(e) => setShopSettings({ ...shopSettings, tagline: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Full Shop Address *
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                required
                value={shopSettings.address}
                onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Shop Mobile / Phone *
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                required
                value={shopSettings.phone}
                onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                className="w-full px-4 py-3 text-lg font-bold border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.gstin}
                onChange={(e) =>
                  setShopSettings({ ...shopSettings, gstin: e.target.value.toUpperCase() })
                }
                className="w-full px-4 py-3 text-lg font-bold uppercase border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.invoicePrefix}
                onChange={(e) =>
                  setShopSettings({
                    ...shopSettings,
                    invoicePrefix: e.target.value.toUpperCase()
                  })
                }
                className="w-full px-4 py-3 text-lg font-bold uppercase border-2 border-slate-300 rounded-xl focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                UPI ID (For Customer QR Code Payments)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.upiId}
                onChange={(e) => setShopSettings({ ...shopSettings, upiId: e.target.value })}
                placeholder="e.g. kisantraders@upi"
                className="w-full px-4 py-3 text-lg font-bold border-2 border-slate-300 rounded-xl focus:border-brand-600 text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.bankName}
                onChange={(e) => setShopSettings({ ...shopSettings, bankName: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.bankAccountNumber}
                onChange={(e) =>
                  setShopSettings({ ...shopSettings, bankAccountNumber: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={shopSettings.ifscCode}
                onChange={(e) =>
                  setShopSettings({ ...shopSettings, ifscCode: e.target.value.toUpperCase() })
                }
                className="w-full px-4 py-3 text-lg uppercase border-2 border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Terms & Conditions on Bill
              </label>
              <textarea
                rows="3"
                disabled={!isAdmin}
                value={shopSettings.termsAndConditions}
                onChange={(e) =>
                  setShopSettings({ ...shopSettings, termsAndConditions: e.target.value })
                }
                className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <BigButton
                type="submit"
                variant="primary"
                disabled={loading}
                icon={Save}
                className="py-4 px-8 text-xl"
              >
                {loading ? t('loading') : 'Save Shop Settings'}
              </BigButton>
            </div>
          )}
        </form>
      )}

      {/* Section 2: Change Password */}
      {activeSection === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl space-y-5">
          <h2 className="text-2xl font-bold text-slate-900 border-b pb-3">
            Change Account Password
          </h2>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              New Password (Min 8 chars, 1 uppercase, 1 lowercase, 1 number) *
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
            />
          </div>

          <BigButton
            type="submit"
            variant="blue"
            disabled={loading}
            className="w-full py-4 text-xl"
          >
            {loading ? t('loading') : 'Update Password'}
          </BigButton>
        </form>
      )}

      {/* Section 3: Staff Management (Admin only) */}
      {activeSection === 'staff' && isAdmin && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-2xl font-bold text-slate-900">
              Staff Accounts & Access Control
            </h2>
            <BigButton
              variant="primary"
              onClick={() => setShowAddStaff(true)}
              icon={Plus}
              className="py-2.5 px-5 text-base"
            >
              + Create Staff Login
            </BigButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b text-slate-600 text-sm uppercase font-bold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-base">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-blue-900 font-semibold">{u.username}</td>
                    <td className="py-3.5 px-4 text-slate-700">{u.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">Create Staff User</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.username}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value.toLowerCase() })
                  }
                  placeholder="e.g. rahul1"
                  className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl lowercase"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Password (Min 8 chars, 1 uppercase, 1 lowercase, 1 number) *
                </label>
                <input
                  type="password"
                  required
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <BigButton
                  variant="secondary"
                  onClick={() => setShowAddStaff(false)}
                  className="py-3 px-6 text-base"
                >
                  {t('cancel')}
                </BigButton>
                <BigButton variant="primary" type="submit" className="py-3 px-6 text-base">
                  Create Staff
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
