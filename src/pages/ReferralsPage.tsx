/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Coins,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { rewardService } from '../services/rewardService';
import { walletService } from '../services/walletService';
import { useAuth } from '../context/AuthContext';
import { ReferralSummary } from '../types';

export const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const res = await rewardService.getReferralSummary(userId);
      setSummary(res);
    } catch (err) {
      console.error('Failed to load referral summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${summary?.code || ''}`
    : `https://nilphasocial.com/register?ref=${summary?.code || ''}`;

  const handleCopyCode = () => {
    if (!summary?.code) return;
    navigator.clipboard.writeText(summary.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'নিলফা সোশ্যালে যোগ দিন',
          text: `নিলফা সোশ্যালে আমার রেফারেল কোড ${summary?.code} ব্যবহার করে যোগ দিন এবং ১০০ ফ্রি ডেমো কয়েন পান!`,
          url: referralLink,
        });
      } catch (e) {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || submittingCode) return;

    setSubmittingCode(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    const res = await rewardService.applyReferralCode(userId, inputCode.trim());
    setSubmittingCode(false);

    if (res.success) {
      setFeedbackSuccess(`রেফারেল কোড সফলভাবে যুক্ত হয়েছে! আপনার ওয়ালেটে +${res.rewardCoins} ডেমো কয়েন যোগ হয়েছে।`);
      setInputCode('');
      loadReferralData();
    } else {
      setFeedbackError(res.error || 'রেফারেল কোডটি সঠিক নয় বা ইতিমধ্যে ব্যবহৃত হয়েছে।');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="বন্ধুদের আমন্ত্রণ ও রেফারেল"
        subtitle="বন্ধুদের আমন্ত্রণ জানিয়ে দুজনই অর্জন করুন ১০০ ডেমো কয়েন ফ্রি বোনাস"
        kicker="কমিউনিটি বিস্তার ও উপহার"
      />

      <DemoNotice
        message="রেফারেল বোনাস হিসেবে প্রদত্ত কয়েন সম্পূর্ণ অ-আর্থিক ডেমো কারেন্সি। এটি কোনো আর্থিক বা ক্যাশ ভ্যালু বহন করে না।"
      />

      {/* Hero Invitation Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3 backdrop-blur-xs">
            <Gift className="w-3.5 h-3.5" />
            উভয়ের জন্য ১০০ ডেমো কয়েন বোনাস
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            নিলফা সোশ্যালে বন্ধু বাড়ান, একসাথে খেলুন
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-2 leading-relaxed">
            আপনার অনন্য রেফারেল লিংক বা কোডটি বন্ধুদের সাথে শেয়ার করুন। বন্ধু নিবন্ধন করলেই আপনি এবং আপনার বন্ধু পাবেন ১০০ নন-ক্যাশ ডেমো কয়েন।
          </p>

          {/* Referral Code Box */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-semibold">
                  আপনার রেফারেল কোড
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
                  {summary?.code || 'NILPHA-DEMO'}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="কোড কপি করুন"
              >
                {copiedCode ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>লিংক শেয়ার করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{feedbackSuccess}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-semibold">{feedbackError}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium">মোট আমন্ত্রিত বন্ধু</span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {summary?.totalReferred || 0} জন
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium">মোট রেফারেল বোনাস</span>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-1">
            <span>+{summary?.totalBonusCoins || 0}</span>
            <span className="text-xs text-slate-400">কয়েন</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium">রেফারেল স্ট্যাটাস</span>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>সক্রিয় ও উন্মুক্ত</span>
          </div>
        </div>
      </div>

      {/* Claim a Friend's Referral Code Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            বন্ধুর রেফারেল কোড আছে?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কোনো বন্ধুর দেওয়া কোড নিচে দিয়ে তাৎক্ষণিক ১০০ ডেমো কয়েন ওয়েলকাম বোনাস সংগ্রহ করুন। (প্রতি অ্যাকাউন্টে একবারই প্রযোজ্য)
          </p>
        </div>

        <form onSubmit={handleApplyCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="যেমন: NILPHA-8A9F32"
            maxLength={20}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]"
          />
          <button
            type="submit"
            disabled={!inputCode.trim() || submittingCode}
            className="px-6 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submittingCode ? 'যাচাই হচ্ছে...' : 'কোড প্রয়োগ করুন'}</span>
          </button>
        </form>
      </div>

      {/* Referrals History List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          আপনার মাধ্যমে যুক্ত বন্ধুদের তালিকা
        </h3>

        {!summary?.referrals || summary.referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              এখনও কোনো বন্ধু আপনার কোড ব্যবহার করেননি
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              উপরের রেফারেল লিংকটি ফেসবুক, মেসেঞ্জার বা হোয়াটসঅ্যাপে শেয়ার করে আমন্ত্রণ জানান।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.referrals.map((ref) => (
              <div key={ref.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] font-bold text-xs flex items-center justify-center">
                    {ref.referee_name ? ref.referee_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {ref.referee_name || 'নতুন সদস্য'}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ref.created_at).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-bold text-xs text-amber-600 dark:text-amber-400 font-mono">
                  <span>+{ref.reward_coins} কয়েন</span>
                  <Coins className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
