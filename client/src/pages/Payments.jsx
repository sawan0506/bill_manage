import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Calendar, User, Banknote } from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const Payments = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments?limit=50');
      if (res.data.success) {
        setPayments(res.data.data);
        setTotalCount(res.data.pagination.totalCount);
      }
    } catch (err) {
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-brand-600 stroke-[2.3]" />
            <span>{t('payments')}</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? 'ग्राहकों से प्राप्त सभी भुगतानों की रसीद एवं विवरण'
              : 'Record of all payments and udhaar clearances collected'}
          </p>
        </div>

        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-right">
          <span className="text-xs uppercase font-bold tracking-wider block opacity-90">
            Total Collected Shown
          </span>
          <span className="text-3xl font-black">
            ₹{totalCollected.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xl font-bold">
            {t('loading')}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xl font-medium">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-base font-bold uppercase">
                  <th className="py-4 px-4">Receipt #</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Mode</th>
                  <th className="py-4 px-4 text-right">Amount Received</th>
                  <th className="py-4 px-4 text-right">Previous Balance</th>
                  <th className="py-4 px-4 text-right">New Balance</th>
                  <th className="py-4 px-4">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-blue-900 text-lg">
                      {p.receiptNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}{' '}
                      at{' '}
                      {new Date(p.paymentDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {p.customer?.name || p.customerName}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {p.paymentMode}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-xl text-emerald-700">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-500">
                      ₹{(p.customerPreviousBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-800">
                      ₹{(p.customerNewBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {p.receivedByName || 'Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
