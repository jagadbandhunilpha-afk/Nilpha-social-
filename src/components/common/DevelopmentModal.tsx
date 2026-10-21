import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { useNotice } from '../../context/NoticeContext';
import { useLanguage } from '../../context/LanguageContext';

export const DevelopmentModal: React.FC = () => {
  const { modalNotice, closeNotice } = useNotice();
  const { t } = useLanguage();

  if (!modalNotice.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={closeNotice}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeNotice}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#155EEF] dark:text-[#38BDF8] uppercase tracking-wider block">
              Nilpha Social · Part 1
            </span>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {modalNotice.title || t('developmentPhaseNotice')}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          {modalNotice.message}
        </p>

        {modalNotice.details && (
          <div className="p-3 mb-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-normal">
            {modalNotice.details}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={closeNotice}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{t('understood')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
