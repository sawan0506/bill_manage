import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';
import { StatCard } from '../components/StatCard.jsx';

export const Reports = () => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'category', 'gst', 'profit'
  const [loading, setLoading] = useState(true);

  // Data states
  const [salesSummary, setSalesSummary] = useState(null);
  const [categorySales, setCategorySales] = useState([]);
  const [gstData, setGstData] = useState(null);
  const [profitData, setProfitData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [salesRes, catRes, gstRes, profitRes] = await Promise.all([
          api.get('/reports/sales'),
          api.get('/reports/category-sales'),
          api.get('/reports/gst'),
          api.get('/reports/profit')
        ]);

        if (salesRes.data.success) setSalesSummary(salesRes.data.data);
        if (catRes.data.success) setCategorySales(catRes.data.data);
        if (gstRes.data.success) setGstData(gstRes.data.data);
        if (profitRes.data.success) setProfitData(profitRes.data.data);
      } catch (err) {
        showToast('Failed to load reports', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-brand-600 stroke-[2.3]" />
            <span>{t('reports')}</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? 'दुकान की कुल बिक्री, श्रेणीवार कमाई, मुनाफा और जीएसटी रिपोर्ट'
              : 'Sales analysis, category breakdown, gross profit, and GST filing report'}
          </p>
        </div>

        <BigButton
          variant="primary"
          onClick={() => window.print()}
          icon={Printer}
          className="py-3 px-6 text-base no-print"
        >
          Print Report
        </BigButton>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'sales', label: 'Sales Overview', icon: TrendingUp },
          { id: 'category', label: 'Category Performance', icon: Layers },
          { id: 'gst', label: 'GST Report', icon: FileText },
          { id: 'profit', label: 'Gross Profit & Margin', icon: Percent }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab 1: Sales Overview */}
      {activeTab === 'sales' && salesSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sales"
              value={`₹${salesSummary.summary.totalSales.toLocaleString('en-IN')}`}
              subtitle={`${salesSummary.summary.totalBills} Bills generated`}
              color="green"
            />
            <StatCard
              title="Total Cash / UPI Paid"
              value={`₹${salesSummary.summary.totalPaid.toLocaleString('en-IN')}`}
              color="blue"
            />
            <StatCard
              title="Total Udhaar Remaining"
              value={`₹${salesSummary.summary.totalDue.toLocaleString('en-IN')}`}
              color="amber"
            />
            <StatCard
              title="Total GST Collected"
              value={`₹${salesSummary.summary.totalTax.toLocaleString('en-IN')}`}
              color="blue"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Sales by Date (दैनिक बिक्री)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-sm">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Bills Count</th>
                    <th className="py-3 px-4 text-right">Day Sales Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-base">
                  {salesSummary.timeline.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{row.date}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {row.billsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-lg">
                        ₹{row.sales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Category Performance */}
      {activeTab === 'category' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Category-wise Sales Breakdown (सामान की श्रेणी अनुसार बिक्री)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorySales.map((cat) => (
              <div
                key={cat.category}
                className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <span className="px-3 py-1 bg-brand-100 text-brand-900 rounded-lg text-sm font-bold uppercase">
                    {cat.category}
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-4">
                    ₹{cat.totalRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-sm font-semibold text-slate-600 flex justify-between">
                  <span>Quantity Sold:</span>
                  <span className="font-bold text-slate-900">{cat.totalQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: GST Report */}
      {activeTab === 'gst' && gstData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Taxable Turnover"
              value={`₹${gstData.summary.totalTaxable.toLocaleString('en-IN')}`}
              color="blue"
            />
            <StatCard
              title="CGST Total"
              value={`₹${gstData.summary.totalCgst.toLocaleString('en-IN')}`}
              color="green"
            />
            <StatCard
              title="SGST Total"
              value={`₹${gstData.summary.totalSgst.toLocaleString('en-IN')}`}
              color="green"
            />
            <StatCard
              title="Total GST Payable"
              value={`₹${gstData.summary.totalTax.toLocaleString('en-IN')}`}
              color="amber"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              GSTR-1 Invoices Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3 text-right">Taxable</th>
                    <th className="py-3 px-3 text-right">CGST</th>
                    <th className="py-3 px-3 text-right">SGST</th>
                    <th className="py-3 px-3 text-right">Total Tax</th>
                    <th className="py-3 px-3 text-right">Invoice Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gstData.bills.map((b) => (
                    <tr key={b.invoiceNumber} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-blue-900">{b.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(b.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {b.customerName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{b.customerGstin}</td>
                      <td className="py-3 px-3 text-right font-medium">
                        ₹{b.taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        ₹{b.cgst.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        ₹{b.sgst.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        ₹{b.totalTax.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{b.invoiceTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Gross Profit Report (Admin only) */}
      {activeTab === 'profit' && profitData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue (Excl. Tax)"
              value={`₹${profitData.totalRevenue.toLocaleString('en-IN')}`}
              color="blue"
            />
            <StatCard
              title="Purchase Cost of Sold Items"
              value={`₹${profitData.totalCost.toLocaleString('en-IN')}`}
              color="rose"
            />
            <StatCard
              title="Gross Profit"
              value={`₹${profitData.grossProfit.toLocaleString('en-IN')}`}
              subtitle="Revenue minus Cost"
              color="green"
            />
            <StatCard
              title="Profit Margin"
              value={`${profitData.profitMargin}%`}
              subtitle="Gross margin on sales"
              color="amber"
            />
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-emerald-950">
            <h3 className="text-2xl font-black mb-2">
              Profit Performance Summary
            </h3>
            <p className="text-lg leading-relaxed font-medium">
              Your hardware shop has achieved a total gross profit of{' '}
              <span className="font-black text-2xl text-emerald-900">
                ₹{profitData.grossProfit.toLocaleString('en-IN')}
              </span>{' '}
              with an average gross margin of{' '}
              <span className="font-black text-2xl text-emerald-900">
                {profitData.profitMargin}%
              </span>
              . High margin items include fittings and PVC solvent cement, while heavy motors and submersibles provide steady cash volume.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
