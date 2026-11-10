import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Share2,
  Receipt,
  CreditCard,
  Phone,
  Clock,
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';

export const Customers = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasDues, setHasDues] = useState(false);

  // Quick Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);

  // Add Customer Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    notes: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/customers?search=${encodeURIComponent(search)}&hasDues=${hasDues}`
      );
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [hasDues]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleSendReminder = async (customer) => {
    try {
      const res = await api.get(`/customers/${customer._id}/whatsapp-reminder`);
      if (res.data.success && res.data.data.whatsappLink) {
        window.open(res.data.data.whatsappLink, '_blank');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate reminder', 'error');
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setRecordingPay(true);
    try {
      const res = await api.post('/payments', {
        customerId: paymentCustomer._id,
        amount: amt,
        paymentMode: payMode,
        notes: payNotes.trim()
      });
      if (res.data.success) {
        showToast(t('paymentRecorded'), 'success');
        setPaymentCustomer(null);
        setPayAmount('');
        setPayNotes('');
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment recording failed', 'error');
    } finally {
      setRecordingPay(false);
    }
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      showToast('Please enter name and phone', 'error');
      return;
    }

    try {
      const res = await api.post('/customers', newCustomer);
      if (res.data.success) {
        showToast('Customer created successfully', 'success');
        setShowAddCustomer(false);
        setNewCustomer({ name: '', phone: '', address: '', gstin: '', notes: '' });
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create customer', 'error');
    }
  };

  const totalOutstanding = customers.reduce(
    (acc, c) => acc + (c.balanceDue > 0 ? c.balanceDue : 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-600 stroke-[2.3]" />
            <span>{t('customerList')}</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? 'ग्राहकों का उधारी खाता, बकाया रकम और व्हाट्सएप पर तकादा संदेश भेजें'
              : 'Customer accounts, pending dues, ledger history, and WhatsApp payment reminders'}
          </p>
        </div>

        <BigButton
          variant="primary"
          onClick={() => setShowAddCustomer(true)}
          icon={Plus}
          className="py-3 px-6 text-lg"
        >
          {t('addCustomer')}
        </BigButton>
      </div>

      {/* Summary Banner */}
      <div className="bg-amber-500 text-slate-950 p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-base font-bold uppercase tracking-wider block opacity-90">
            {t('totalUdhaarDue')}
          </span>
          <span className="text-4xl font-black">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          onClick={() => setHasDues(!hasDues)}
          className={`px-5 py-3 rounded-xl font-bold text-base transition-all ${
            hasDues
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-900 hover:bg-slate-100 shadow'
          }`}
        >
          {hasDues ? '✓ Showing Dues Only' : 'Show Only Customers with Dues'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-6 h-6 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchCustomer')}
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
            />
          </div>
          <BigButton type="submit" variant="blue" className="py-3 px-6 text-base">
            Search
          </BigButton>
        </form>
      </div>

      {/* Customers List Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xl font-bold">
            {t('loading')}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xl font-medium">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-base font-bold uppercase">
                  <th className="py-4 px-4">Customer Name</th>
                  <th className="py-4 px-4">Mobile Number</th>
                  <th className="py-4 px-4">Address / Village</th>
                  <th className="py-4 px-4 text-right">Balance Due (Udhaar)</th>
                  <th className="py-4 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {customers.map((c) => {
                  const hasDue = c.balanceDue > 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 text-lg">
                        {c.name}
                        {c.gstin && (
                          <div className="text-xs font-semibold text-slate-500">
                            GSTIN: {c.gstin}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {c.phone}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {c.address || '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`text-2xl font-black ${
                            hasDue ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          ₹{c.balanceDue.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Receive Payment Button */}
                          {hasDue && (
                            <button
                              onClick={() => {
                                setPaymentCustomer(c);
                                setPayAmount(String(c.balanceDue));
                              }}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-sm"
                            >
                              ₹ {t('receivePayment')}
                            </button>
                          )}

                          {/* WhatsApp Reminder Button */}
                          {hasDue && (
                            <button
                              onClick={() => handleSendReminder(c)}
                              className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition"
                              title="Send WhatsApp Reminder"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          )}

                          {/* View Ledger */}
                          <button
                            onClick={() => navigate(`/customers/${c._id}/ledger`)}
                            className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-sm transition"
                          >
                            {t('viewLedger')}
                          </button>
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

      {/* Quick Receive Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-slate-900">
                {t('receivePayment')}
              </h3>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-sm font-semibold text-amber-800 block">Customer:</span>
              <span className="text-xl font-black text-amber-950">{paymentCustomer.name}</span>
              <span className="text-sm font-bold text-amber-800 block mt-1">
                Total Pending Udhaar: ₹{paymentCustomer.balanceDue.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('paymentAmount')} *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount received"
                  className="w-full px-4 py-3 text-2xl font-black border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('paymentMode')}
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-4 py-2.5 text-lg font-semibold border-2 border-slate-300 rounded-xl"
                >
                  <option value="Cash">Cash (नकद)</option>
                  <option value="UPI">UPI (फोनपे / जीपे / पेटीएम)</option>
                  <option value="Bank Transfer">Bank Transfer (बैंक खाता)</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Notes / Receipt Remark
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in full / Part payment"
                  className="w-full px-4 py-2 text-base border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <BigButton
                  variant="secondary"
                  onClick={() => setPaymentCustomer(null)}
                  className="py-3 px-6 text-base"
                >
                  {t('cancel')}
                </BigButton>
                <BigButton
                  variant="primary"
                  type="submit"
                  disabled={recordingPay}
                  className="py-3 px-6 text-base"
                >
                  {recordingPay ? t('loading') : 'Confirm Payment'}
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-slate-900">
                {t('addCustomer')}
              </h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer Full Name"
                  className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerPhone')} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerAddress')}
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Village / Town / Address"
                  className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerGstin')}
                </label>
                <input
                  type="text"
                  value={newCustomer.gstin}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, gstin: e.target.value.toUpperCase() })
                  }
                  placeholder="GSTIN (Optional)"
                  className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl uppercase focus:border-brand-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <BigButton
                  variant="secondary"
                  onClick={() => setShowAddCustomer(false)}
                  className="py-3 px-6 text-base"
                >
                  {t('cancel')}
                </BigButton>
                <BigButton variant="primary" type="submit" className="py-3 px-6 text-base">
                  {t('save')}
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
