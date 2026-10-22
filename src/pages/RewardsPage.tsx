/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Gift,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Coins,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { rewardService } from '../services/rewardService';
import { walletService } from '../services/walletService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DailyCheckinStatus, UserChallengeItem } from '../types';

export const RewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?.id || 'demo-user-1';

  const [loading, setLoading] = useState(true);
  const [claimingDay, setClaimingDay] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<DailyCheckinStatus | null>(null);
  const [challenges, setChallenges] = useState<UserChallengeItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(200);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [claimingChallengeId, setClaimingChallengeId] = useState<string | null>(null);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const [wallet, status, userChallenges] = await Promise.all([
        walletService.getWallet(userId),
        rewardService.getDailyCheckinStatus(userId),
        rewardService.getUserChallenges(userId),
      ]);
      setWalletBalance(wallet.balance);
      setCheckinStatus(status);
      setChallenges(userChallenges);
    } catch (err) {
      console.error('Failed to load rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, [userId]);

  const handleClaimDailyCheckin = async () => {
    if (!checkinStatus || checkinStatus.todayClaimed || claimingDay) return;
    setClaimingDay(true);
    setClaimSuccessMessage(null);
    setClaimErrorMessage(null);

    const result = await rewardService.claimDailyCheckin(userId);
    setClaimingDay(false);

    if (result.success) {
      setClaimSuccessMessage(`অভিনন্দন! আপনি আজকের জন্য +${result.rewardCoins} ডেমো কয়েন পেয়েছেন!`);
      loadRewardsData();
    } else {
      setClaimErrorMessage(result.error || 'আজকের রিওয়ার্ড দাবি করা সম্ভব হয়নি।');
    }
  };

  const handleClaimChallenge = async (challengeId: string) => {
    setClaimingChallengeId(challengeId);
    setClaimSuccessMessage(null);
    setClaimErrorMessage(null);

    const result = await rewardService.claimChallenge(userId, challengeId);
    setClaimingChallengeId(null);

    if (result.success) {
      setClaimSuccessMessage(`চ্যালেঞ্জ সম্পন্ন! আপনি +${result.rewardCoins} ডেমো কয়েন পেয়েছেন!`);
      loadRewardsData();
    } else {
      setClaimErrorMessage(result.error || 'চ্যালেঞ্জ রিওয়ার্ড দাবি করা যায়নি।');
    }
  };

  const daysRewardMap = [10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="রিওয়ার্ড ও দৈনিক চ্যালেঞ্জ"
        subtitle="নিয়মিত উপস্থিতিতে এবং মজার চ্যালেঞ্জ সম্পন্ন করে ফ্রি ডেমো কয়েন সংগ্রহ করুন"
        kicker="বিনামূল্যে নন-ক্যাশ রিওয়ার্ড"
      />

      {/* Non-cash policy notice */}
      <DemoNotice
        message="সকল রিওয়ার্ড সম্পূর্ণ ফ্রি ডেমো কয়েন। এর কোনো আর্থিক বা নগদ মূল্য নেই, এবং এটি উত্তোলনযোগ্য নয়।"
      />

      {/* Top Banner with Balance and Quick Stats */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-[#151D2C] to-slate-900 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                নন-ক্যাশ ডেমো রিওয়ার্ড
              </span>
              {checkinStatus && (checkinStatus.streakCount ?? checkinStatus.currentStreak ?? 0) > 0 && (
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-semibold text-xs border border-orange-500/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {checkinStatus.streakCount ?? checkinStatus.currentStreak} দিন স্ট্রিক!
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              প্রতিদিনের খেলা ও বোনাস
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              প্রতিদিন নিলফা সোশ্যালে প্রবেশ করে ও সহজ চ্যালেঞ্জগুলো সম্পন্ন করে আপনার ডেমো ওয়ালেট ব্যালেন্স বাড়ান।
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 dark:bg-slate-800/60 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-slate-300 font-medium block">বর্তমান ব্যালেন্স</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-amber-300">
                  {walletBalance.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">কয়েন</span>
              </div>
            </div>
            <Link
              to="/wallet"
              className="ml-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              ওয়ালেট
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Alert / Notification Feedback */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{claimSuccessMessage}</span>
        </div>
      )}

      {claimErrorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-semibold">{claimErrorMessage}</span>
        </div>
      )}

      {/* Section 1: 7-Day Daily Check-in Streak Calendar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#155EEF]" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ৭ দিনের দৈনিক লগইন স্ট্রিক
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ধারাবাহিকভাবে প্রতিদিন লগইন করলে ৭ম দিনে ৫০ ডেমো কয়েন মেগা বোনাস আনলক হবে!
            </p>
          </div>

          <button
            onClick={handleClaimDailyCheckin}
            disabled={checkinStatus?.todayClaimed || claimingDay}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              checkinStatus?.todayClaimed
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20 active:scale-95'
            }`}
          >
            {checkinStatus?.todayClaimed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>আজকে সংগ্রহ করা হয়েছে</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>{claimingDay ? 'সংগ্রহ হচ্ছে...' : 'আজকের রিওয়ার্ড নিন (+কয়েন)'}</span>
              </>
            )}
          </button>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {daysRewardMap.map((reward, index) => {
            const dayNum = index + 1;
            const currentDayNumber = checkinStatus?.currentDayNumber || 1;
            const isCompleted = dayNum < currentDayNumber || (dayNum === currentDayNumber && checkinStatus?.todayClaimed);
            const isToday = dayNum === currentDayNumber && !checkinStatus?.todayClaimed;

            return (
              <div
                key={dayNum}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between relative transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : isToday
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {dayNum === 7 && (
                  <span className="absolute -top-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                    মেগা
                  </span>
                )}

                <span className="text-xs font-semibold mb-2">দিন {dayNum}</span>

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center my-1 ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : isToday
                      ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 animate-bounce'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : dayNum === 7 ? (
                    <Trophy className="w-6 h-6" />
                  ) : (
                    <Gift className="w-6 h-6" />
                  )}
                </div>

                <div className="mt-2 font-black text-sm font-mono flex items-center justify-center gap-1">
                  <span>+{reward}</span>
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                </div>

                <span className="text-[10px] font-medium mt-1">
                  {isCompleted ? 'সম্পন্ন' : isToday ? 'আজকের' : 'আসন্ন'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Daily and Weekly Challenges */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#155EEF]" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              দৈনিক ও সাপ্তাহিক চ্যালেঞ্জ
            </h3>
          </div>
          <span className="text-xs text-slate-500">প্রতিদিন রাত ১২:০০ টায় রিসেট হয়</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => {
            const currentCount = challenge.progress ?? challenge.current_count ?? 0;
            const targetCount = challenge.target ?? challenge.target_count ?? 1;
            const isCompleted = currentCount >= targetCount;
            const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));

            return (
              <div
                key={challenge.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#155EEF] dark:text-[#38BDF8] uppercase tracking-wider block">
                        {challenge.type === 'daily' ? 'দৈনিক চ্যালেঞ্জ' : 'সাপ্তাহিক মিশন'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {challenge.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      +{challenge.reward_coins}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {challenge.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>অগ্রগতি:</span>
                      <span>
                        {challenge.progress} / {challenge.target} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          challenge.claimed
                            ? 'bg-slate-400'
                            : isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-[#155EEF]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  {challenge.claimed ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ইতিমধ্যে দাবি করা হয়েছে
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaimChallenge(challenge.id)}
                      disabled={claimingChallengeId === challenge.id}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {claimingChallengeId === challenge.id
                        ? 'সংগ্রহ হচ্ছে...'
                        : `রিওয়ার্ড সংগ্রহ করুন (+${challenge.reward_coins} কয়েন)`}
                    </button>
                  ) : (
                    <Link
                      to="/games"
                      className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      গেম জোনে যান
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
