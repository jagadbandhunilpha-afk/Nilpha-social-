import React from 'react';
import {
  Wallet,
  Coins,
  Award,
  CreditCard,
  AlertTriangle,
  History,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { EmptyState } from '../components/common/EmptyState';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';

export const WalletPage: React.FC = () => {
  const { t } = useLanguage();
  const { openNotice } = useNotice();

  const handleWalletAction = (actionTitle: string) => {
    openNotice(
      actionTitle,
      'পার্ট ১-এ কোনো আসল পেমেন্ট গেটওয়ে বা আর্থিক লেনদেন যুক্ত নেই। এটি কেবল একটি ড্রাফট ইন্টারফেস।',
      'বাংলাদেশ ব্যাংকের নির্দেশনা মেনে ভবিষ্যৎ সংস্করণে অনুমোদিত পেমেন্ট চ্যানেল বিবেচনা করা হবে।'
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t('walletTitle')}
        subtitle={t('walletSubtitle')}
        kicker="ডিজিটাল ওয়ালেট ও রিওয়ার্ড"
      />

      {/* Prominent Disclaimer Notice */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block mb-0.5">সতর্কীকরণ ও নীতিগত স্পষ্টতা:</span>
          {t('walletDisclaimer')} কোনো নগদ অর্থ জমা, উত্তোলন বা জুয়া খেলার সুবিধা এখানে নেই।
        </div>
      </div>

      {/* 3 Main Currency / Points Shell Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Platform Credits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('platformCredits')}
            </h3>
            {/* Status clearly labeled Not Connected */}
            <div className="mt-2 mb-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                --
              </span>
              <span className="text-xs text-slate-400 font-mono">ক্রেডিট</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ● {t('statusNotConnected')}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleWalletAction(t('depositBtn'))}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('depositBtn')} (লকড)</span>
            </button>
          </div>
        </div>

        {/* Reward Points */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('rewardPoints')}
            </h3>
            <div className="mt-2 mb-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ২৫০
              </span>
              <span className="text-xs text-slate-400 font-mono">পয়েন্ট (ডেমো)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              কমিউনিটি কর্মকাণ্ডের জন্য নন-ক্যাশ ব্যাজ
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleWalletAction(t('transferBtn'))}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('transferBtn')} (লকড)</span>
            </button>
          </div>
        </div>

        {/* Demo-Game Coins */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('demoGameCoins')}
            </h3>
            <div className="mt-2 mb-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ১,০০০
              </span>
              <span className="text-xs text-slate-400 font-mono">কয়েন (নন-ক্যাশ)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              শুধুমাত্র গেম জোনের স্কোর ট্র্যাকিংয়ের জন্য
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleWalletAction(t('withdrawBtn'))}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('withdrawBtn')} (অনুপলব্ধ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Placeholder */}
      <div className="rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <History className="w-5 h-5 text-[#155EEF]" />
            <span>{t('transactionHistory')}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">পার্ট ১ খসড়া</span>
        </div>

        <div className="py-8">
          <EmptyState
            title={t('noTransactions')}
            description="পার্ট ১ ইন্টারফেসে কোনো লাইভ পেমেন্ট ট্রানজ্যাকশন ডাটাবেজ নেই। ভবিষ্যতে অনুমোদিত গেটওয়ে যুক্ত হলে এখানে বিস্তারিত স্টেটমেন্ট দেখা যাবে।"
            icon={<History className="w-8 h-8" />}
          />
        </div>
      </div>
    </div>
  );
};
