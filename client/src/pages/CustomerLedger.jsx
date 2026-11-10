import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Receipt,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Share2
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';

export const CustomerLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get(`/customers/${id}/ledger`);
        if (res.data.success) {
          setCustomer(res.data.data.customer);
          setCurrentBalance(res.data.data.currentBalance);
          setLedger(res.data.data.ledger);
        }
      } catch (err) {
        showToast('Failed to load ledger', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [id]);

  const handlePrintLedger = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xl font-bold">
        {t('loading')}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-500 text-xl font-medium">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="no-print flex items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-lg"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back to Customers</span>
        </button>

        <BigButton
          variant="primary"
          onClick={handlePrintLedger}
          icon={Printer}
          className="py-3 px-6 text-base"
        >
          Print Ledger Statement
        </BigButton>
      </div>

      {/* Customer Header Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {customer.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-base text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {customer.phone}
              </span>
              {customer.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {customer.address}
                </span>
              )}
              {customer.gstin && (
                <span className="font-bold text-slate-800">GSTIN: {customer.gstin}</span>
              )}
            </div>
          </div>

          {/* Current Outstanding Balance */}
          <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 text-right min-w-[220px]">
            <span className="text-xs font-bold uppercase tracking-wider block opacity-90">
              Current Outstanding Balance
            </span>
            <span className="text-3xl font-black">
              ₹{currentBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-800 text-white font-bold text-xl">
          Account Transaction Statement (खाता विवरणी)
        </div>

        {ledger.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-lg">
            No transactions recorded for this customer yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-sm font-bold uppercase">
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Reference #</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4 text-right">Debit (बकाया)</th>
                  <th className="py-4 px-4 text-right">Credit (जमा)</th>
                  <th className="py-4 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {ledger.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {new Date(entry.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          entry.type === 'INVOICE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {entry.referenceNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {entry.description}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-700">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-lg text-slate-900">
                      ₹{entry.runningBalance.toFixed(2)}
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
