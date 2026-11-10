import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Receipt,
  AlertTriangle,
  PlusCircle,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { BigButton } from '../components/BigButton.jsx';
import { InvoiceModal } from '../components/InvoiceModal.jsx';

export const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todaySales: 0,
    todayReceived: 0,
    todayBillsCount: 0,
    totalPendingDues: 0,
    pendingCustomersCount: 0,
    lowStockCount: 0,
    recentBills: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, setRes] = useState ? await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/settings')
        ]) : [];
        if (dashRes.data.success) {
          setStats(dashRes.data.data);
        }
        if (setRes.data.success) {
          setSettings(setRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner: Big Action Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {t('dashboard')}
          </h1>
          <p className="text-lg text-blue-200 mt-2 font-medium">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* The ALWAYS VISIBLE Big "NEW BILL" button */}
        <BigButton
          variant="primary"
          onClick={() => navigate('/new-bill')}
          icon={PlusCircle}
          className="w-full md:w-auto py-5 px-8 text-2xl shadow-xl hover:scale-105"
        >
          {t('quickNewBill')}
        </BigButton>
      </div>

      {/* 4 Big High-Contrast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('todaySales')}
          value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
          subtitle={`${stats.todayBillsCount} ${t('todayBills')}`}
          icon={IndianRupee}
          color="green"
          onClick={() => navigate('/bills')}
        />

        <StatCard
          title={t('pendingUdhaar')}
          value={`₹${stats.totalPendingDues.toLocaleString('en-IN')}`}
          subtitle={`${stats.pendingCustomersCount} customers have dues`}
          icon={Clock}
          color="amber"
          onClick={() => navigate('/customers?hasDues=true')}
        />

        <StatCard
          title={t('lowStockAlert')}
          value={`${stats.lowStockCount} Items`}
          subtitle="Stock below minimum level"
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? 'rose' : 'blue'}
          onClick={() => navigate('/products?lowStock=true')}
        />

        <StatCard
          title={t('todayBills')}
          value={stats.todayBillsCount}
          subtitle={`₹${stats.todayReceived.toLocaleString('en-IN')} Received`}
          icon={Receipt}
          color="blue"
          onClick={() => navigate('/bills')}
        />
      </div>

      {/* Recent Bills Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
              <Receipt className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t('recentBills')}</h2>
          </div>
          <button
            onClick={() => navigate('/bills')}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-lg"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {stats.recentBills.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xl font-medium">
            {t('noRecentBills')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 text-base font-bold uppercase">
                  <th className="py-4 px-4">Invoice #</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Date / Time</th>
                  <th className="py-4 px-4">Mode</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-lg">
                {stats.recentBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-blue-900">
                      {bill.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {bill.customer?.name}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-base">
                      {new Date(bill.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}{' '}
                      at{' '}
                      {new Date(bill.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {bill.paymentMode}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-900 text-xl">
                      ₹{bill.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${
                          bill.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={async () => {
                          const res = await api.get(`/bills/${bill._id}`);
                          if (res.data.success) {
                            setSelectedBill(res.data.data);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-base"
                      >
                        <Eye className="w-5 h-5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Print & Share Modal */}
      {selectedBill && (
        <InvoiceModal
          bill={selectedBill}
          settings={settings}
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};
