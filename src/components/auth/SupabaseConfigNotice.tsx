import React from 'react';
import { AlertTriangle, Database, ExternalLink, KeyRound } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getSupabaseConfigStatus } from '../../lib/supabase';

interface SupabaseConfigNoticeProps {
  className?: string;
}

export const SupabaseConfigNotice: React.FC<SupabaseConfigNoticeProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { isConfigured, missingKeys } = getSupabaseConfigStatus();

  if (isConfigured) return null;

  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 shadow-2xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
            <span>{t('supabaseNotConfiguredTitle')}</span>
          </h4>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
            {t('supabaseNotConfiguredDesc')}
          </p>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/80 dark:border-amber-800/40 text-xs font-mono text-slate-700 dark:text-slate-300 mb-3 space-y-1">
            {missingKeys.map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>প্রয়োজনীয় কি অনুপস্থিত: <strong>{key}</strong></span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <span>বিস্তারিত নির্দেশের জন্য দেখুন:</span>
            <span className="font-mono bg-amber-200/50 dark:bg-amber-900/40 px-2 py-0.5 rounded-md text-[11px]">
              AUTH_SETUP.md
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
