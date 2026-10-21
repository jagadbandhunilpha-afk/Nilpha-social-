import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const VerifyEmailPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] dark:text-[#38BDF8] mx-auto mb-4 flex items-center justify-center">
          <MailCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('emailVerificationRequiredTitle')}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {t('emailVerificationRequiredDesc')}
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            ইমেইল যাচাইকরণের পর আপনার অ্যাকাউন্টটি সম্পূর্ণ সুরক্ষিত ও প্রস্তুত হয়ে যাবে। ভেরিফিকেশন সম্পন্ন হলে নিচের বাটনে ক্লিক করে লগইন করুন।
          </span>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors shadow-sm"
        >
          <span>{t('login')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
