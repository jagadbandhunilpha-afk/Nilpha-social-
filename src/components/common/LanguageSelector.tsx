import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={() => setLanguage('bn')}
          aria-label="Switch to Bengali"
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            language === 'bn'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          বাং
        </button>
        <button
          onClick={() => setLanguage('en')}
          aria-label="Switch to English"
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            language === 'en'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
      <div className="pl-2 text-slate-400 dark:text-slate-500">
        <Languages className="w-4 h-4" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
          language === 'bn'
            ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        বাংলা (BN)
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        English (EN)
      </button>
    </div>
  );
};
