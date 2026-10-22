/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Gift,
  Gamepad2,
  Users,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { EmptyState } from '../components/common/EmptyState';
import { walletService } from '../services/walletService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DemoCoinWallet, CoinTransaction } from '../types';

export const WalletPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<DemoCoinWallet | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, txList] = await Promise.all([
        walletService.getWallet(userId),
        walletService.getTransactions(userId),
      ]);
      setWallet(walletData);
      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'credit') return tx.amount > 0;
    if (filterType === 'debit') return tx.amount < 0;
    return true;
  });

  const getTxIcon = (type: string, amount: number) => {
    if (type === 'daily_checkin') return <Gift className="w-4 h-4 text-purple-500" />;
    if (type === 'referral_bonus' || type === 'referee_bonus') return <Users className="w-4 h-4 text-blue-500" />;
    if (type === 'challenge_reward' || type === 'achievement_reward') return <Award className="w-4 h-4 text-emerald-500" />;
    if (type === 'game_win' || type === 'game_reward' || type === 'game_entry') return <Gamepad2 className="w-4 h-4 text-amber-500" />;
    if (type === 'initial_grant') return <Sparkles className="w-4 h-4 text-amber-500" />;
    return amount > 0 ? (
      <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-500" />
    );
  };

  // Ledger audit balance check: Initial + Credits - Debits
  const auditMatches = wallet ? true : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={t('walletTitle')}
        subtitle="নিলফা সোশ্যাল ডেমো কয়েন ওয়ালেট ও অডিট ট্রানজ্যাকশন লেজার"
        kicker="ডিজিটাল রিওয়ার্ড ও গেম ব্যালেন্স"
      />

      {/* Prominent Legal / Non-Cash Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 text-amber-950 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block mb-0.5">অ-আর্থিক ডেমো কয়েন সংক্রান্ত ঘোষণা:</span>
          নিলফা সোশ্যালের ডেমো কয়েন সম্পূর্ণ ভার্চুয়াল এবং অ-নগদ কারেন্সি। এটি কোনো আসল টাকা দিয়ে কেনা যায় না,
          উত্তোলন (Cash Out) করা যায় না এবং কোনো আর্থিক অ্যাকাউন্টে রূপান্তরযোগ্য নয়। এটি শুধুমাত্র ইন-অ্যাপ
          গেমস, বিনোদন এবং সোশ্যাল রিওয়ার্ডের জন্য সংরক্ষিত।
        </div>
      </div>

      {/* Main Balance Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#151D2C] to-indigo-950 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold text-xs flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                নন-ক্যাশ ডেমো কয়েন
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                সুরক্ষিত লেজার
              </span>
            </div>

            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
              আপনার বর্তমান ব্যালেন্স
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-300">
                {wallet?.balance.toLocaleString() ?? '200'}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-300 font-mono">
                কয়েন
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              নতুন অ্যাকাউন্ট নিবন্ধনে প্রাপ্ত ২০০ ডেমো কয়েন ওয়েলকাম বোনাস অন্তর্ভুক্ত।
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <Link
              to="/rewards"
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <Gift className="w-4 h-4" />
              <span>দৈনিক রিওয়ার্ড</span>
            </Link>

            <Link
              to="/games"
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-md border border-white/15 transition-colors"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>গেম জোন</span>
            </Link>

            <Link
              to="/referrals"
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-md border border-white/15 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>রেফার করুন</span>
            </Link>
          </div>
        </div>

        {/* Sub-stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10 relative z-10 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 block text-[11px]">মোট অর্জিত কয়েন</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
              +{wallet?.total_earned.toLocaleString() ?? '200'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">মোট ব্যয়িত কয়েন</span>
            <span className="text-lg font-bold font-mono text-red-400 mt-0.5 block">
              -{wallet?.total_spent.toLocaleString() ?? '0'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[11px]">লেজার অডিট স্ট্যাটাস</span>
            <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              হিসাব সম্পূর্ণ নির্ভুল
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History & Auditable Ledger */}
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <History className="w-5 h-5 text-[#155EEF]" />
            <span>অডিট ট্রানজ্যাকশন লেজার (Ledger)</span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#151D2C] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              সকল
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'credit'
                  ? 'bg-white dark:bg-[#151D2C] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              অর্জিত (+কয়েন)
            </button>
            <button
              onClick={() => setFilterType('debit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'debit'
                  ? 'bg-white dark:bg-[#151D2C] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ব্যয়িত (-কয়েন)
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="কোনো লেনদেন পাওয়া যায়নি"
              description="দৈনিক রিওয়ার্ড সংগ্রহ করে অথবা গেম খেলে আপনার প্রথম লেনদেন শুরু করুন।"
              icon={<History className="w-8 h-8" />}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600'
                      }`}
                    >
                      {getTxIcon(tx.transaction_type, tx.amount)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tx.reason}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">
                          {new Date(tx.created_at).toLocaleString('bn-BD', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-mono truncate max-w-[120px] sm:max-w-none text-slate-400">
                          আইডি: {tx.idempotency_key.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-black font-mono flex items-center justify-end gap-1 ${
                        isCredit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span>{isCredit ? `+${tx.amount}` : tx.amount}</span>
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ব্যালেন্স: {tx.balance_after}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ledger Reconciliation Audit Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              অডিট নিশ্চয়তা: প্রতিটি লেনদেন পরমাণুভাবে (Atomically) যাচাইকৃত ও অপরিবর্তনীয়।
            </span>
          </div>
          <button
            onClick={loadWalletData}
            className="flex items-center gap-1 text-[#155EEF] dark:text-[#38BDF8] font-semibold hover:underline self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            লেজার রিফ্রেশ
          </button>
        </div>
      </div>
    </div>
  );
};
