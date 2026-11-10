import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { BigButton } from './BigButton.jsx';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  danger = true,
  loading = false,
  children
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                danger ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-xl text-slate-700 leading-relaxed font-medium">{message}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50">
          <BigButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="py-3 px-6 text-base"
          >
            {cancelText || t('cancel')}
          </BigButton>
          <BigButton
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
            className="py-3 px-6 text-base"
          >
            {loading ? t('loading') : confirmText || t('confirm')}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
