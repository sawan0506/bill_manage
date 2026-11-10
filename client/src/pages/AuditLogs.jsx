import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RotateCcw, Clock, User } from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AuditLogs = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 50,
        action: actionFilter,
        resourceType: resourceFilter
      });
      const res = await api.get(`/audit?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-brand-600 stroke-[2.3]" />
          <span>{t('auditLogs')}</span>
        </h1>
        <p className="text-base text-slate-500 font-medium mt-1">
          Complete immutable audit trail of logins, bill generation, cancellations, price edits, and inventory changes
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 text-base font-semibold border-2 border-slate-300 rounded-xl"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FAILED_LOGIN">FAILED_LOGIN</option>
            <option value="BILL_CREATE">BILL_CREATE</option>
            <option value="BILL_CANCEL">BILL_CANCEL</option>
            <option value="PRICE_CHANGE">PRICE_CHANGE</option>
            <option value="STOCK_ADJUST">STOCK_ADJUST</option>
            <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
          </select>
        </div>

        <div>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-4 py-2.5 text-base font-semibold border-2 border-slate-300 rounded-xl"
          >
            <option value="">All Resource Types</option>
            <option value="Bill">Bill</option>
            <option value="Product">Product</option>
            <option value="User">User</option>
            <option value="Customer">Customer</option>
            <option value="Settings">Settings</option>
          </select>
        </div>

        <button
          onClick={() => {
            setActionFilter('');
            setResourceFilter('');
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xl font-bold">
            {t('loading')}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xl font-medium">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                          log.action.includes('CANCEL') || log.action.includes('FAILED')
                            ? 'bg-rose-100 text-rose-800'
                            : log.action.includes('CREATE')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action.includes('PRICE')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {log.resourceType}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.performedByName}</div>
                      <div className="text-xs text-slate-500 uppercase">{log.performedByRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
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
