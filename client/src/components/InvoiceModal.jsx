import React, { useRef } from 'react';
import { Printer, Download, Share2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { BigButton } from './BigButton.jsx';
import { api } from '../api/axiosClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const InvoiceModal = ({ bill, settings, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const printAreaRef = useRef(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/bills/${bill._id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${bill.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download invoice PDF', 'error');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const res = await api.get(`/bills/${bill._id}/whatsapp`);
      if (res.data.success && res.data.data.whatsappLink) {
        window.open(res.data.data.whatsappLink, '_blank');
      }
    } catch (err) {
      showToast('Failed to generate WhatsApp link', 'error');
    }
  };

  const shopName = settings?.shopName || 'Kisan Hardware & Sanitary Mart';
  const shopAddress = settings?.address || 'Main Market Road';
  const shopPhone = settings?.phone || '';
  const shopGstin = settings?.gstin || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Top Action Bar (hidden in print) */}
        <div className="no-print p-4 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Invoice #{bill.invoiceNumber}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                bill.paymentStatus === 'paid'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {bill.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <BigButton
              variant="primary"
              onClick={handlePrint}
              icon={Printer}
              className="py-2.5 px-4 text-base"
            >
              {t('printBill')}
            </BigButton>
            <BigButton
              variant="blue"
              onClick={handleDownloadPdf}
              icon={Download}
              className="py-2.5 px-4 text-base"
            >
              PDF
            </BigButton>
            <BigButton
              variant="warning"
              onClick={handleShareWhatsApp}
              icon={Share2}
              className="py-2.5 px-4 text-base"
            >
              WhatsApp
            </BigButton>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          id="printable-invoice"
          ref={printAreaRef}
          className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
                  {shopName}
                </h1>
                <p className="text-base text-slate-600 font-medium mt-1">
                  {settings?.tagline || 'Pipes, Motors, Submersibles & Fittings'}
                </p>
                <p className="text-sm text-slate-700 mt-2">{shopAddress}</p>
                {shopPhone && <p className="text-sm text-slate-700">Phone: {shopPhone}</p>}
                {shopGstin && (
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    GSTIN: {shopGstin}
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className="inline-block bg-blue-900 text-white px-4 py-1.5 rounded-lg text-lg font-bold tracking-wide uppercase mb-2">
                  TAX INVOICE
                </div>
                <div className="text-xl font-bold text-slate-900">
                  #{bill.invoiceNumber}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Date:{' '}
                  {new Date(bill.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-slate-600">
                  Mode: <span className="font-semibold">{bill.paymentMode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Billed To (Customer):
            </div>
            <div className="flex flex-wrap justify-between items-center text-base">
              <div>
                <span className="font-bold text-lg text-slate-900">
                  {bill.customer?.name}
                </span>
                <span className="text-slate-600 ml-4">
                  Phone: {bill.customer?.phone}
                </span>
              </div>
              {bill.customer?.gstin && (
                <div className="text-sm font-semibold text-slate-800">
                  GSTIN: {bill.customer.gstin}
                </div>
              )}
            </div>
            {bill.customer?.address && (
              <div className="text-sm text-slate-600 mt-1">
                Address: {bill.customer.address}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="bg-slate-800 text-white text-sm uppercase">
                <th className="py-2.5 px-3 rounded-l-lg">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">HSN</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Disc (₹)</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-base">
              {bill.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.name}
                    {item.brand && (
                      <span className="text-xs text-slate-500 ml-1.5 font-normal">
                        ({item.brand})
                      </span>
                    )}
                    {item.sizeModel && (
                      <span className="text-xs text-slate-500 ml-1 font-normal">
                        - {item.sizeModel}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 text-sm">
                    {item.hsnCode || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right">{item.sellingPrice.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {(item.discountAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">{item.taxRate}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {item.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="flex flex-col md:flex-row justify-between gap-6 border-t-2 border-slate-300 pt-4">
            {/* Left Terms & Bank */}
            <div className="w-full md:w-1/2 text-sm text-slate-600">
              {settings?.bankName && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Bank / UPI:</span>
                  <div>Bank: {settings.bankName}</div>
                  <div>
                    A/C: {settings.bankAccountNumber} | IFSC: {settings.ifscCode}
                  </div>
                  {settings.upiId && (
                    <div className="font-bold text-emerald-700">UPI: {settings.upiId}</div>
                  )}
                </div>
              )}
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">Terms & Conditions:</span>
                <p className="whitespace-pre-line">
                  {settings?.termsAndConditions || 'Goods once sold are non-refundable.'}
                </p>
              </div>
            </div>

            {/* Right Summary Table */}
            <div className="w-full md:w-5/12 text-base">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                {bill.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span>-₹{bill.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span>₹{bill.taxableAmount.toFixed(2)}</span>
                </div>
                {bill.isInterState ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST:</span>
                    <span>₹{bill.igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span>₹{bill.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span>₹{bill.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {bill.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Round Off:</span>
                    <span>
                      {bill.roundOff > 0 ? '+' : ''}₹{bill.roundOff.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-blue-900 text-white rounded-xl text-xl font-black mt-2">
                  <span>GRAND TOTAL:</span>
                  <span>₹{bill.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-semibold pt-1">
                  <span>Paid Amount:</span>
                  <span>₹{bill.paidAmount.toFixed(2)}</span>
                </div>
                {bill.balanceDue > 0 && (
                  <div className="flex justify-between p-2.5 bg-amber-100 text-amber-900 rounded-lg text-lg font-bold border border-amber-300">
                    <span>Remaining Balance (Udhaar):</span>
                    <span>₹{bill.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer signature line */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-sm text-slate-600">
            <div>
              <p>Cashier / Staff: <span className="font-semibold">{bill.createdByName || 'Admin'}</span></p>
              <p className="text-xs text-slate-400 mt-1">Thank you for your visit!</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-800">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
