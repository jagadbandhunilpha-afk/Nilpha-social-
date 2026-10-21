import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DemoNoticeProps {
  message?: string;
  variant?: 'info' | 'warning';
  className?: string;
}

export const DemoNotice: React.FC<DemoNoticeProps> = ({
  message,
  variant = 'info',
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

  if (dismissed) return null;

  const text = message || t('developmentPhaseNotice');

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-sm transition-all ${
        variant === 'warning'
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-950 dark:text-blue-200'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#155EEF] dark:text-[#38BDF8]" />
        <div className="leading-snug">
          <span className="font-semibold mr-1.5 text-xs tracking-wider uppercase opacity-80">
            {t('demoNoticeTag')}:
          </span>
          <span>{text}</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 -mr-1 -mt-0.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
