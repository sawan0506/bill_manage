import React, { useState, useEffect } from 'react';
import {
  Search,
  Receipt,
  Eye,
  Download,
  Share2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { InvoiceModal } from '../components/InvoiceModal.jsx';

export const BillsList = () => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [bills, setBills] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedBill, setSelectedBill] = useState(null);
  const [settings, setSettings] = useState(null);
  const [billToCancel, setBillToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 25,
        search,
        status,
        paymentStatus,
        startDate,
        endDate
      });

      const [bRes, sRes] = await Promise.all([
        api.get(`/bills?${params.toString()}`),
        api.get('/settings')
      ]);

      if (bRes.data.success) {
        setBills(bRes.data.data);
        setTotalCount(bRes.data.pagination.totalCount);
      }
      if (sRes.data.success) {
        setSettings(sRes.data.data);
      }
    } catch (err) {
      showToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, status, paymentStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      showToast('Please enter a cancellation reason', 'error');
      return;
    }

    setCancelling(true);
    try {
      const res = await api.post(`/bills/${billToCancel._id}/cancel`, {
        reason: cancelReason.trim()
      });
      if (res.data.success) {
        showToast('Bill cancelled and stock restored successfully', 'success');
        setBillToCancel(null);
        setCancelReason('');
        fetchBills();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel bill', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-brand-600 stroke-[2.3]" />
            <span>{t('allBills')}</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? `कुल ${totalCount} बिल उपलब्ध हैं। बिल देखें, प्रिंट निकालें या व्हाट्सएप पर भेजें।`
              : `Total ${totalCount} bills. View, print, download PDF, or share on WhatsApp.`}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-6 h-6 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Invoice No, Customer Name or Phone..."
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
            />
          </div>

          <div>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-800"
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid (पूर्ण भुगतान)</option>
              <option value="partial">Partial (आधा भुगतान)</option>
              <option value="unpaid">Unpaid / Udhaar (उधार)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <BigButton type="submit" variant="blue" className="py-3 px-6 text-base w-full">
              Search
            </BigButton>
            <BigButton
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPaymentStatus('');
                setStartDate('');
                setEndDate('');
                setPage(1);
                fetchBills();
              }}
              className="py-3 px-4 text-base"
              title="Reset Filters"
            >
              <RotateCcw className="w-5 h-5" />
            </BigButton>
          </div>
        </form>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xl font-bold">
            {t('loading')}
          </div>
        ) : bills.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xl font-medium">
            No bills found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-base font-bold uppercase">
                  <th className="py-4 px-4">Invoice #</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Mode</th>
                  <th className="py-4 px-4 text-right">Grand Total</th>
                  <th className="py-4 px-4 text-right">Paid</th>
                  <th className="py-4 px-4 text-right">Udhaar Due</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {bills.map((bill) => {
                  const isCancelled = bill.status === 'cancelled';
                  return (
                    <tr
                      key={bill._id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCancelled ? 'bg-rose-50/60 opacity-75' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-blue-900 text-lg">
                        {bill.invoiceNumber}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {new Date(bill.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-base">
                          {bill.customer?.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {bill.customer?.phone}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {bill.paymentMode}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 text-xl">
                        ₹{bill.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-700">
                        ₹{bill.paidAmount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-700">
                        {bill.balanceDue > 0 ? `₹${bill.balanceDue.toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isCancelled ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black uppercase">
                            CANCELLED
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              bill.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {bill.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* View & Print */}
                          <button
                            onClick={async () => {
                              const res = await api.get(`/bills/${bill._id}`);
                              if (res.data.success) {
                                setSelectedBill(res.data.data);
                              }
                            }}
                            className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition"
                            title="View / Print"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {/* WhatsApp Direct */}
                          <button
                            onClick={async () => {
                              const res = await api.get(`/bills/${bill._id}/whatsapp`);
                              if (res.data.success) {
                                window.open(res.data.data.whatsappLink, '_blank');
                              }
                            }}
                            className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>

                          {/* Cancel Bill (Admin only) */}
                          {isAdmin && !isCancelled && (
                            <button
                              onClick={() => setBillToCancel(bill)}
                              className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition"
                              title="Cancel Bill & Return Stock"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedBill && (
        <InvoiceModal
          bill={selectedBill}
          settings={settings}
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {/* Cancel Bill Confirmation Modal (Admin only) */}
      {billToCancel && (
        <ConfirmModal
          isOpen={!!billToCancel}
          title="Cancel Bill & Restore Stock"
          message={`Are you sure you want to cancel Invoice #${billToCancel.invoiceNumber}? All ${billToCancel.items?.length || 0} items will be automatically returned to inventory stock.`}
          confirmText="Yes, Cancel Bill"
          cancelText="No, Keep Bill"
          danger={true}
          loading={cancelling}
          onConfirm={handleCancelConfirm}
          onClose={() => {
            setBillToCancel(null);
            setCancelReason('');
          }}
        >
          <div className="mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Cancellation Reason *
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer returned items, wrong size billed"
              className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl focus:border-brand-600"
            />
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};
