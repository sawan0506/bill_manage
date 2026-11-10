import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  UserCheck,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ProductAutocomplete } from '../components/ProductAutocomplete.jsx';
import { BigButton } from '../components/BigButton.jsx';
import { InvoiceModal } from '../components/InvoiceModal.jsx';
import { calculateBillTotals } from '../utils/billingCalculator.js';

export const NewBill = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerId, setCustomerId] = useState(null);

  // Items State
  const [items, setItems] = useState([]);

  // Payment & Settings State
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState(null);

  // Status & Modal
  const [submitting, setSubmitting] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Load shop settings on mount
  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.success) {
        setSettings(res.data.data);
      }
    });
  }, []);

  // Quick 1-click for walk-in customer
  const handleWalkInCustomer = () => {
    setCustomerName(lang === 'hi' ? 'नकद ग्राहक' : 'Cash Customer');
    setCustomerPhone('9999999999');
    setCustomerAddress('');
    setCustomerGstin('');
    setCustomerId(null);
  };

  // Lookup customer by phone when phone reaches 10 digits
  const handlePhoneChange = async (val) => {
    setCustomerPhone(val);
    const clean = val.trim();
    if (clean.length === 10) {
      try {
        const res = await api.get(`/customers?search=${clean}`);
        if (res.data.success && res.data.data.length > 0) {
          const cust = res.data.data[0];
          setCustomerName(cust.name);
          setCustomerAddress(cust.address || '');
          setCustomerGstin(cust.gstin || '');
          setCustomerId(cust._id);
          showToast(
            `Found customer: ${cust.name} ${
              cust.balanceDue > 0 ? `(Pending Udhaar: ₹${cust.balanceDue})` : ''
            }`,
            'info'
          );
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  // Add Product from Autocomplete Search
  const handleSelectProduct = (product) => {
    const existingIndex = items.findIndex((it) => it.productId === product._id);

    if (existingIndex !== -1) {
      // Increase qty of already added item
      setItems((prev) => {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      });
      showToast(`Increased quantity for ${product.name}`, 'info');
    } else {
      // Add new item row
      const newItem = {
        productId: product._id,
        name: product.name,
        brand: product.brand || '',
        sizeModel: product.sizeModel || '',
        category: product.category,
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice || 0,
        taxRate: settings?.enableGst !== false ? product.gstRate : 0,
        hsnCode: product.hsnCode || '',
        stockQuantity: product.stockQuantity,
        quantity: 1,
        discountType: 'amount',
        discountValue: 0
      };
      setItems((prev) => [newItem, ...prev]);
      showToast(`Added: ${product.name}`, 'success');
    }
  };

  // Update line item property (quantity or discount)
  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove line item
  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Live calculation of totals
  const enableGst = settings?.enableGst !== false;
  const calculatedTotals = calculateBillTotals(
    items.map((it) => ({
      ...it,
      quantity: Math.max(0.01, Number(it.quantity) || 0),
      discountValue: Math.max(0, Number(it.discountValue) || 0)
    })),
    {
      isInterState,
      enableGst,
      paidAmount:
        paymentMode === 'Credit'
          ? 0
          : paidAmountInput !== ''
          ? Number(paidAmountInput)
          : undefined
    }
  );

  // If in full payment mode and user hasn't explicitly entered partial paid amount, assume full grand total
  const displayPaidAmount =
    paymentMode === 'Credit'
      ? 0
      : paidAmountInput !== ''
      ? Number(paidAmountInput)
      : calculatedTotals.grandTotal;

  const displayBalanceDue =
    paymentMode === 'Credit'
      ? calculatedTotals.grandTotal
      : Math.max(0, calculatedTotals.grandTotal - displayPaidAmount);

  // Clear entire form
  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerGstin('');
    setCustomerId(null);
    setItems([]);
    setPaymentMode('Cash');
    setPaidAmountInput('');
    setIsInterState(false);
    setNotes('');
  };

  // Submit and create Bill
  const handleSubmitBill = async () => {
    if (items.length === 0) {
      showToast('Please add at least one product to the bill', 'error');
      return;
    }
    if (!customerName.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerGstin: customerGstin.trim(),
        paymentMode,
        paidAmount: displayPaidAmount,
        isInterState,
        notes,
        idempotencyKey: `bill_${Date.now()}_${Math.random()}`,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          discountType: it.discountType || 'amount',
          discountValue: Number(it.discountValue) || 0
        }))
      };

      const res = await api.post('/bills', payload);
      if (res.data.success) {
        setSavedBill(res.data.data);
        setShowInvoiceModal(true);
        showToast(t('billSuccess'), 'success');
        handleResetForm();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save bill';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Title and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>{t('billingTitle')}</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold uppercase">
              POS Active
            </span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? 'आसानी से सामान खोजें, मात्रा भरें और तुरंत प्रिंट निकालें'
              : 'Fast product search, add items, and instant invoice print'}
          </p>
        </div>

        <BigButton
          variant="secondary"
          onClick={handleResetForm}
          icon={RotateCcw}
          className="py-3 px-5 text-base"
        >
          {t('clearBill')}
        </BigButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer + Product Search + Items Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-brand-600" />
                <span>{t('customerDetails')}</span>
              </h2>
              <button
                type="button"
                onClick={handleWalkInCustomer}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-brand-700 rounded-xl font-bold text-sm transition border border-blue-200"
              >
                + {lang === 'hi' ? 'नकद ग्राहक (Walk-in)' : 'Walk-in Cash Customer'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerPhone')} *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="10-digit Mobile (e.g. 9811223344)"
                  className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerName')} *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name / Firm Name"
                  className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerAddress')}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Village / Town / Landmark"
                  className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {t('customerGstin')}
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="GSTIN (Optional)"
                  className="w-full px-4 py-3 text-lg font-medium border-2 border-slate-300 rounded-xl focus:border-brand-600 uppercase text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Product Autocomplete Search Bar */}
          <div className="bg-white p-6 rounded-2xl border-2 border-brand-200 shadow-md">
            <label className="block text-lg font-black text-slate-800 mb-2">
              🔍 {t('addItem')} (Search by Name, Brand, Size or Code):
            </label>
            <ProductAutocomplete onSelectProduct={handleSelectProduct} autoFocus />
          </div>

          {/* Billed Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-800 text-white flex items-center justify-between">
              <span className="text-xl font-bold">
                {lang === 'hi' ? 'बिल में जोड़े गए सामान' : 'Items Added to Bill'} ({items.length})
              </span>
              <span className="text-sm font-medium text-slate-300">
                {lang === 'hi' ? 'मात्रा (Qty) बदलें या हटाएं' : 'Change qty or remove'}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="text-6xl mb-3">🛒</div>
                <div className="text-2xl font-bold text-slate-700">
                  {lang === 'hi' ? 'बिल में कोई सामान नहीं है' : 'No items added yet'}
                </div>
                <p className="text-slate-500 text-lg mt-1 font-medium">
                  {lang === 'hi'
                    ? 'ऊपर सर्च बॉक्स में सामान का नाम टाइप करें और तुरंत जोड़ें।'
                    : 'Type product name in the search box above to add items.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-sm font-bold uppercase">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Rate (₹)</th>
                      <th className="py-3 px-4 text-center">Disc (₹)</th>
                      <th className="py-3 px-4 text-center">GST</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-base">
                    {items.map((item, idx) => {
                      const itemCalc = calculatedTotals.items[idx];
                      return (
                        <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-lg">
                              {item.name}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">
                              {item.brand && <span className="mr-2 text-slate-700 font-semibold">{item.brand}</span>}
                              {item.sizeModel && <span className="mr-2">{item.sizeModel}</span>}
                              <span>({item.unit})</span>
                            </div>
                          </td>

                          {/* Quantity with +/- Buttons */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))
                                }
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-lg flex items-center justify-center active:scale-95"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(idx, 'quantity', Math.max(0, Number(e.target.value)))
                                }
                                className="w-16 py-1.5 px-2 text-center text-lg font-bold border-2 border-slate-300 rounded-lg focus:border-brand-600 text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(idx, 'quantity', item.quantity + 1)
                                }
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-lg flex items-center justify-center active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-slate-800 text-lg">
                            ₹{item.sellingPrice.toFixed(2)}
                          </td>

                          {/* Flat Discount Input */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.discountValue || ''}
                              placeholder="0"
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'discountValue',
                                  Math.max(0, Number(e.target.value))
                                )
                              }
                              className="w-16 py-1 px-2 text-center text-base font-semibold border border-slate-300 rounded-lg focus:border-brand-600"
                            />
                          </td>

                          <td className="py-3 px-4 text-center font-medium text-slate-600">
                            {item.taxRate}%
                          </td>

                          <td className="py-3 px-4 text-right font-black text-xl text-slate-900">
                            ₹{(itemCalc?.totalAmount || 0).toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-6 h-6 stroke-[2.2]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Totals, Payment Mode & Big Action Button (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-3">
              {lang === 'hi' ? 'भुगतान एवं बिल सारांश' : 'Bill Summary & Payment'}
            </h2>

            {/* Inter-State Tax Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="interStateCheck"
                checked={isInterState}
                onChange={(e) => setIsInterState(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label
                htmlFor="interStateCheck"
                className="text-base font-bold text-slate-700 cursor-pointer"
              >
                {lang === 'hi'
                  ? 'अन्य राज्य बिक्री (IGST लागू करें)'
                  : 'Inter-State Sale (Apply IGST)'}
              </label>
            </div>

            {/* Price Calculations Breakdown */}
            <div className="space-y-3 text-lg">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('subtotal')}:</span>
                <span className="font-bold text-slate-800">
                  ₹{calculatedTotals.subtotal.toFixed(2)}
                </span>
              </div>

              {calculatedTotals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{t('discount')}:</span>
                  <span>-₹{calculatedTotals.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('taxableAmount')}:</span>
                <span className="font-bold text-slate-800">
                  ₹{calculatedTotals.taxableAmount.toFixed(2)}
                </span>
              </div>

              {enableGst && (
                <>
                  {isInterState ? (
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>IGST:</span>
                      <span className="font-bold text-slate-800">
                        ₹{calculatedTotals.igstAmount.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>CGST:</span>
                        <span className="font-bold text-slate-800">
                          ₹{calculatedTotals.cgstAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>SGST:</span>
                        <span className="font-bold text-slate-800">
                          ₹{calculatedTotals.sgstAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {calculatedTotals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-base">
                  <span>{t('roundOff')}:</span>
                  <span>
                    {calculatedTotals.roundOff > 0 ? '+' : ''}₹
                    {calculatedTotals.roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              {/* HUGE GRAND TOTAL DISPLAY */}
              <div className="p-4 bg-blue-900 text-white rounded-2xl shadow-lg mt-4">
                <div className="text-sm uppercase font-bold tracking-wider text-blue-200">
                  {t('grandTotal')}
                </div>
                <div className="text-4xl font-black tracking-tight mt-1">
                  ₹{calculatedTotals.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-3 pt-2">
              <label className="block text-base font-bold text-slate-800">
                {t('paymentMode')}:
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { mode: 'Cash', label: t('cash'), icon: Banknote },
                  { mode: 'UPI', label: t('upi'), icon: QrCode },
                  { mode: 'Credit', label: t('credit'), icon: Clock },
                  { mode: 'Partial', label: t('partial'), icon: CreditCard }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(item.mode);
                        if (item.mode === 'Credit') {
                          setPaidAmountInput('0');
                        } else if (item.mode === 'Cash' || item.mode === 'UPI') {
                          setPaidAmountInput('');
                        }
                      }}
                      className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 font-bold text-base transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm ring-2 ring-brand-300'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.3]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Partial / Paid Amount Input */}
              {(paymentMode === 'Partial' || paymentMode === 'Credit') && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 mt-3">
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-1">
                      {t('paidAmount')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={calculatedTotals.grandTotal}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder="Enter amount paid"
                      className="w-full px-4 py-2.5 text-xl font-bold border-2 border-amber-300 rounded-xl focus:border-brand-600 text-slate-900"
                    />
                  </div>

                  <div className="flex justify-between text-amber-950 font-black text-lg pt-1 border-t border-amber-200">
                    <span>{t('balanceDue')}:</span>
                    <span>₹{displayBalanceDue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BIG "SAVE & PRINT BILL" BUTTON */}
            <BigButton
              variant="primary"
              onClick={handleSubmitBill}
              disabled={submitting || items.length === 0}
              icon={Printer}
              className="w-full py-5 text-2xl shadow-xl hover:scale-[1.02]"
            >
              {submitting ? t('loading') : t('saveAndPrint')}
            </BigButton>
          </div>
        </div>
      </div>

      {/* Invoice Modal for Instant Print / PDF / WhatsApp Share */}
      {showInvoiceModal && savedBill && (
        <InvoiceModal
          bill={savedBill}
          settings={settings}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};
