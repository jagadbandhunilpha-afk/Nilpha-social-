/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { walletService } from './walletService';
import {
  DailyCheckinStatus,
  UserChallengeItem,
  ReferralSummary,
  AchievementItem,
} from '../types';

const STORAGE_KEY_CHECKIN_PREFIX = 'nilpha_checkin_';
const STORAGE_KEY_CHALLENGES_PREFIX = 'nilpha_challenges_';
const STORAGE_KEY_REFERRALS_PREFIX = 'nilpha_referrals_';
const STORAGE_KEY_ACHIEVEMENTS_PREFIX = 'nilpha_achievements_';

const STREAK_COIN_SCHEDULE = [10, 15, 20, 25, 30, 40, 50];

const INITIAL_CHALLENGES_DEF = [
  {
    key: 'play_racing',
    title_bn: 'মিনি কার রেসিং সম্পূর্ণ করুন',
    title_en: 'Finish a Mini Car Racing session',
    target: 1,
    reward: 20,
    period: 'daily' as const,
  },
  {
    key: 'play_bubble',
    title_bn: 'বাবল পাজল খেলুন',
    title_en: 'Play Bubble Puzzle',
    target: 1,
    reward: 25,
    period: 'daily' as const,
  },
  {
    key: 'play_memory',
    title_bn: 'মেমোরি ম্যাচ কার্ড মেলান',
    title_en: 'Solve a Memory Match game',
    target: 1,
    reward: 20,
    period: 'daily' as const,
  },
  {
    key: 'play_tictactoe',
    title_bn: 'টিক-ট্যাক-টো ম্যাচ খেলুন',
    title_en: 'Play a Tic-Tac-Toe match',
    target: 1,
    reward: 15,
    period: 'daily' as const,
  },
  {
    key: 'seven_up_round',
    title_bn: 'সেভেন আপ ডেমো বোর্ডে অংশ নিন',
    title_en: 'Play Seven Up Demo Arena',
    target: 1,
    reward: 20,
    period: 'daily' as const,
  },
];

const ALL_ACHIEVEMENTS_DEF: AchievementItem[] = [
  {
    key: 'first_game',
    title_bn: 'প্রথম গেমার',
    title_en: 'First Game Explorer',
    description_bn: 'যেকোনো একটি মিনি গেম সফলভাবে সম্পন্ন করেছেন।',
    description_en: 'Successfully completed any mini game.',
    icon: 'Gamepad2',
    reward_coins: 30,
    isUnlocked: false,
  },
  {
    key: 'speed_racer',
    title_bn: 'গতির রাজা',
    title_en: 'Speed Racer',
    description_bn: 'কার রেসিং গেমে ৫০ পয়েন্টের বেশি স্কোর অর্জন করেছেন।',
    description_en: 'Scored over 50 points in Mini Car Racing.',
    icon: 'Trophy',
    reward_coins: 50,
    isUnlocked: false,
  },
  {
    key: 'memory_master',
    title_bn: 'স্মৃতিশক্তির জাদুকর',
    title_en: 'Memory Master',
    description_bn: 'মেমোরি ম্যাচের সবগুলো কার্ড সফলভাবে মেলালেন।',
    description_en: 'Matched all pairs in Memory Match.',
    icon: 'Sparkles',
    reward_coins: 40,
    isUnlocked: false,
  },
  {
    key: 'seven_up_lucky',
    title_bn: 'লাকি সেভেন',
    title_en: 'Lucky Seven',
    description_bn: 'সেভেন আপ ডেমো গেমে সঠিক যোগফল অনুমান করলেন।',
    description_en: 'Correctly guessed a round in Seven Up Demo.',
    icon: 'Dice',
    reward_coins: 50,
    isUnlocked: false,
  },
  {
    key: 'social_friend',
    title_bn: 'কমিউনিটি বন্ধু',
    title_en: 'Community Connector',
    description_bn: 'রেফারাল কোডের মাধ্যমে একজন বন্ধুকে আমন্ত্রণ জানিয়েছেন।',
    description_en: 'Invited a verified friend with your referral code.',
    icon: 'Users',
    reward_coins: 60,
    isUnlocked: false,
  },
];

export const rewardService = {
  /**
   * Retrieves the daily check-in status and streak.
   */
  async getDailyCheckinStatus(userId: string): Promise<DailyCheckinStatus> {
    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: claims } = await supabase
          .from('daily_rewards_claims')
          .select('claim_date, streak_day')
          .eq('user_id', userId)
          .order('claim_date', { ascending: false })
          .limit(1);

        const lastClaim = claims && claims.length > 0 ? claims[0] : null;
        const hasClaimedToday = lastClaim ? lastClaim.claim_date === today : false;

        let streak = 0;
        if (lastClaim) {
          const lastDate = new Date(lastClaim.claim_date);
          const currentDate = new Date(today);
          const diffDays = Math.round(
            (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 0) {
            streak = lastClaim.streak_day;
          } else if (diffDays === 1) {
            streak = lastClaim.streak_day;
          } else {
            streak = 0; // Streak broken
          }
        }

        const nextStreakDay = hasClaimedToday
          ? streak
          : streak >= 7
          ? 1
          : streak + 1;
        const nextRewardCoins =
          STREAK_COIN_SCHEDULE[Math.min(nextStreakDay - 1, 6)] || 10;

        return {
          hasClaimedToday,
          todayClaimed: hasClaimedToday,
          currentStreak: streak,
          streakCount: streak,
          currentDayNumber: nextStreakDay,
          nextRewardCoins,
          lastClaimDate: lastClaim?.claim_date || null,
          streakDays: STREAK_COIN_SCHEDULE.map((coins, index) => {
            const dayNum = index + 1;
            return {
              day: dayNum,
              coins,
              isClaimed: dayNum <= streak,
              isToday: dayNum === nextStreakDay && !hasClaimedToday,
            };
          }),
        };
      } catch (err) {
        console.warn('Supabase getDailyCheckinStatus error, fallback:', err);
      }
    }

    // Local / Offline Fallback
    const key = `${STORAGE_KEY_CHECKIN_PREFIX}${userId}`;
    let data: any = { lastClaimDate: null, streak: 0 };
    try {
      const raw = localStorage.getItem(key);
      if (raw) data = JSON.parse(raw);
    } catch (err) {}

    const hasClaimedToday = data.lastClaimDate === today;
    const streak = data.streak || 0;
    const nextStreakDay = hasClaimedToday ? streak : streak >= 7 ? 1 : streak + 1;
    const nextRewardCoins = STREAK_COIN_SCHEDULE[Math.min(nextStreakDay - 1, 6)] || 10;

    return {
      hasClaimedToday,
      todayClaimed: hasClaimedToday,
      currentStreak: streak,
      streakCount: streak,
      currentDayNumber: nextStreakDay,
      nextRewardCoins,
      lastClaimDate: data.lastClaimDate,
      streakDays: STREAK_COIN_SCHEDULE.map((coins, index) => {
        const dayNum = index + 1;
        return {
          day: dayNum,
          coins,
          isClaimed: dayNum <= streak,
          isToday: dayNum === nextStreakDay && !hasClaimedToday,
        };
      }),
    };
  },

  /**
   * Claim today's daily login reward.
   */
  async claimDailyCheckin(userId: string): Promise<{ success: boolean; coins: number; rewardCoins: number; newBalance: number; error?: string }> {
    const status = await this.getDailyCheckinStatus(userId);
    if (status.hasClaimedToday) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: 'আজকের দৈনিক পুরস্কার ইতিমধ্যে দাবি করা হয়েছে।' };
    }

    const today = new Date().toISOString().split('T')[0];
    const newStreak = status.currentStreak >= 7 ? 1 : status.currentStreak + 1;
    const rewardCoins = STREAK_COIN_SCHEDULE[newStreak - 1] || 10;

    // Credit coins through atomic ledger
    const tx = await walletService.executeTransaction({
      userId,
      amount: rewardCoins,
      transactionType: 'daily_checkin',
      reason: `দৈনিক চেক-ইন পুরস্কার (দিন ${newStreak}): +${rewardCoins} ডেমো কয়েন`,
      idempotencyKey: `checkin_${userId}_${today}`,
    });

    if (!tx.success) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: tx.error };
    }

    // Record claim in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('daily_rewards_claims').insert({
          user_id: userId,
          claim_date: today,
          streak_day: newStreak,
          coins_rewarded: rewardCoins,
        });
      } catch (err) {
        console.warn('Supabase record claim error:', err);
      }
    }

    // Save locally
    const key = `${STORAGE_KEY_CHECKIN_PREFIX}${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify({ lastClaimDate: today, streak: newStreak }));
    } catch (err) {}

    return { success: true, coins: rewardCoins, rewardCoins, newBalance: tx.newBalance };
  },

  /**
   * Retrieves user challenges for today.
   */
  async getUserChallenges(userId: string): Promise<UserChallengeItem[]> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${STORAGE_KEY_CHALLENGES_PREFIX}${userId}_${today}`;

    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (err) {}

    const expiresAt = new Date();
    expiresAt.setUTCHours(23, 59, 59, 999);

    const initial: UserChallengeItem[] = INITIAL_CHALLENGES_DEF.map((def, idx) => ({
      id: `ch-${today}-${idx}`,
      user_id: userId,
      challenge_key: def.key,
      title_bn: def.title_bn,
      title_en: def.title_en,
      title: def.title_bn,
      description: def.title_bn,
      target_count: def.target,
      target: def.target,
      current_count: 0,
      progress: 0,
      reward_coins: def.reward,
      is_completed: false,
      is_claimed: false,
      claimed: false,
      period: def.period,
      type: def.period,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }));

    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch (err) {}

    return initial;
  },

  /**
   * Increment challenge progress when user plays a game or takes an action.
   */
  async incrementChallengeProgress(userId: string, challengeKey: string, increment = 1): Promise<void> {
    const challenges = await this.getUserChallenges(userId);
    const target = challenges.find((c) => c.challenge_key === challengeKey);
    if (!target || target.is_completed) return;

    target.current_count = Math.min(target.target_count, target.current_count + increment);
    target.progress = target.current_count;
    if (target.current_count >= target.target_count) {
      target.is_completed = true;
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `${STORAGE_KEY_CHALLENGES_PREFIX}${userId}_${today}`;
    try {
      localStorage.setItem(key, JSON.stringify(challenges));
    } catch (err) {}
  },

  /**
   * Claim reward for a completed challenge.
   */
  async claimChallengeReward(userId: string, challengeId: string): Promise<{ success: boolean; coins: number; rewardCoins: number; newBalance: number; error?: string }> {
    const challenges = await this.getUserChallenges(userId);
    const target = challenges.find((c) => c.id === challengeId);
    if (!target) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: 'চ্যালেঞ্জ খুঁজে পাওয়া যায়নি।' };
    }
    if (!target.is_completed) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: 'চ্যালেঞ্জ এখনও সম্পন্ন হয়নি।' };
    }
    if (target.is_claimed) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: 'এই পুরস্কার ইতিমধ্যে দাবি করা হয়েছে।' };
    }

    const tx = await walletService.executeTransaction({
      userId,
      amount: target.reward_coins,
      transactionType: 'challenge_reward',
      reason: `চ্যালেঞ্জ সম্পন্ন পুরস্কার (${target.title_bn}): +${target.reward_coins} ডেমো কয়েন`,
      referenceId: target.id,
      idempotencyKey: `ch_claim_${target.id}`,
    });

    if (!tx.success) {
      return { success: false, coins: 0, rewardCoins: 0, newBalance: 0, error: tx.error };
    }

    target.is_claimed = true;
    target.claimed = true;
    const today = new Date().toISOString().split('T')[0];
    const key = `${STORAGE_KEY_CHALLENGES_PREFIX}${userId}_${today}`;
    try {
      localStorage.setItem(key, JSON.stringify(challenges));
    } catch (err) {}

    return { success: true, coins: target.reward_coins, rewardCoins: target.reward_coins, newBalance: tx.newBalance };
  },

  /**
   * Alias for claimChallengeReward
   */
  async claimChallenge(userId: string, challengeId: string) {
    return this.claimChallengeReward(userId, challengeId);
  },

  /**
   * Retrieves the referral summary and history for a user.
   */
  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(-6);
    const referralCode = `NILPHA-${hex}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nilpha.social';
    const referralUrl = `${baseUrl}/register?ref=${referralCode}`;

    const key = `${STORAGE_KEY_REFERRALS_PREFIX}${userId}`;
    let history: any[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) history = JSON.parse(raw);
    } catch (err) {}

    // If empty seed one demo verified referral for realistic demonstration
    if (history.length === 0) {
      history = [
        {
          id: 'ref-demo-1',
          referee_name: 'ফারহান আহমেদ',
          referee_username: 'farhan_dev',
          status: 'verified',
          reward_coins: 50,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ];
      try {
        localStorage.setItem(key, JSON.stringify(history));
      } catch (err) {}
    }

    const totalCoinsEarned = history
      .filter((h) => h.status === 'verified')
      .reduce((sum, h) => sum + h.reward_coins, 0);

    return {
      referralCode,
      code: referralCode,
      referralUrl,
      totalReferrals: history.length,
      totalReferred: history.length,
      totalCoinsEarned,
      totalBonusCoins: totalCoinsEarned,
      referralHistory: history,
      referrals: history,
    };
  },

  /**
   * Apply a referral code during signup or onboarding.
   * Prevents self-referral and duplicate claims.
   */
  async applyReferralCode(
    refereeUserId: string,
    codeOrName: string,
    refereeUsername?: string,
    codeArg?: string
  ): Promise<{ success: boolean; rewardCoins: number; error?: string }> {
    const rawCode = codeArg || codeOrName || '';
    const cleanCode = rawCode.trim().toUpperCase();

    let hash = 0;
    for (let i = 0; i < refereeUserId.length; i++) {
      hash = (hash << 5) - hash + refereeUserId.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(-6);
    const myCode = `NILPHA-${hex}`;

    if (cleanCode === myCode) {
      return { success: false, rewardCoins: 0, error: 'নিজের রেফারাল কোড নিজে ব্যবহার করা যাবে না (Self-referral is forbidden).' };
    }

    // Check if user already applied a referral code
    const appliedKey = `nilpha_applied_ref_${refereeUserId}`;
    if (localStorage.getItem(appliedKey)) {
      return { success: false, rewardCoins: 0, error: 'আপনি ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করেছেন (Already applied).' };
    }

    const bonusAmount = 100;

    // Award 100 demo coins to the referee as welcome referral bonus
    const tx = await walletService.executeTransaction({
      userId: refereeUserId,
      amount: bonusAmount,
      transactionType: 'referral_reward',
      reason: `রেফারাল আমন্ত্রণ বোনাস (${cleanCode}): +${bonusAmount} ডেমো কয়েন`,
      idempotencyKey: `ref_referee_${refereeUserId}`,
    });

    try {
      localStorage.setItem(appliedKey, cleanCode);
    } catch (e) {}

    // Unlock social achievement
    await this.unlockAchievement(refereeUserId, 'social_friend');

    return { success: true, rewardCoins: bonusAmount };
  },

  /**
   * Retrieves the achievements list with unlock statuses.
   */
  async getUserAchievements(userId: string): Promise<AchievementItem[]> {
    const key = `${STORAGE_KEY_ACHIEVEMENTS_PREFIX}${userId}`;
    let unlockedKeys: string[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) unlockedKeys = JSON.parse(raw);
    } catch (err) {}

    return ALL_ACHIEVEMENTS_DEF.map((ach) => {
      const isUnlocked = unlockedKeys.includes(ach.key);
      return {
        ...ach,
        id: ach.key,
        title: ach.title_bn,
        description: ach.description_bn,
        isUnlocked,
        unlocked: isUnlocked,
        progress: isUnlocked ? 1 : 0,
        max_progress: 1,
      };
    });
  },

  /**
   * Unlock an achievement and reward coins.
   */
  async unlockAchievement(userId: string, achievementKey: string): Promise<void> {
    const key = `${STORAGE_KEY_ACHIEVEMENTS_PREFIX}${userId}`;
    let unlockedKeys: string[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) unlockedKeys = JSON.parse(raw);
    } catch (err) {}

    if (unlockedKeys.includes(achievementKey)) return;

    const achDef = ALL_ACHIEVEMENTS_DEF.find((a) => a.key === achievementKey);
    if (!achDef) return;

    unlockedKeys.push(achievementKey);
    try {
      localStorage.setItem(key, JSON.stringify(unlockedKeys));
    } catch (err) {}

    // Credit achievement reward
    await walletService.executeTransaction({
      userId,
      amount: achDef.reward_coins,
      transactionType: 'achievement_reward',
      reason: `অ্যাচিভমেন্ট আনলক (${achDef.title_bn}): +${achDef.reward_coins} ডেমো কয়েন`,
      idempotencyKey: `ach_${userId}_${achievementKey}`,
    });
  },
};
