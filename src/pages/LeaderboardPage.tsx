/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Gamepad2,
  Sparkles,
  CheckCircle2,
  Lock,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { gameService } from '../services/gameService';
import { rewardService } from '../services/rewardService';
import { useAuth } from '../context/AuthContext';
import { GameLeaderboardEntry, AchievementItem } from '../types';

const GAMES = [
  { id: 'car-racing', name: 'Mini Car Racing', icon: '🏎️' },
  { id: 'bubble-puzzle', name: 'Bubble Puzzle', icon: '🫧' },
  { id: 'funny-runner', name: 'Funny Runner', icon: '🏃' },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', icon: '❌' },
  { id: 'seven-up', name: 'Seven Up Arena', icon: '🎲' },
];

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTabParam = searchParams.get('tab') === 'achievements' ? 'achievements' : 'leaderboard';
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>(activeTabParam);
  const [selectedGame, setSelectedGame] = useState('car-racing');
  const [leaderboard, setLeaderboard] = useState<GameLeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'achievements') {
      setActiveTab('achievements');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'leaderboard') {
          const lb = await gameService.getLeaderboard(selectedGame);
          setLeaderboard(lb);
        } else {
          const ach = await rewardService.getUserAchievements(userId);
          setAchievements(ach);
        }
      } catch (err) {
        console.error('Failed to load leaderboard/achievements:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedGame, activeTab, userId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="লিডারবোর্ড ও অর্জনসমূহ"
        subtitle="সেরা খেলোয়াড়দের তালিকা এবং বিশেষ মাইলফলক অর্জনের সম্মাননা"
        kicker="গেম চ্যাম্পিয়নশিপ ও ট্রফি"
      />

      <DemoNotice
        message="সকল লিডারবোর্ড পয়েন্ট ও ব্যাজ বিনোদনমূলক। এর কোনো ক্যাশ বা আর্থিক পুরষ্কার নেই।"
      />

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('leaderboard');
            setSearchParams({});
          }}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>শীর্ষ খেলোয়াড় লিডারবোর্ড</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('achievements');
            setSearchParams({ tab: 'achievements' });
          }}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'achievements'
              ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>অর্জন ও ব্যাজ (Achievements)</span>
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Game Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedGame === game.id
                    ? 'bg-[#155EEF] text-white shadow-md'
                    : 'bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{game.icon}</span>
                <span>{game.name}</span>
              </button>
            ))}
          </div>

          {/* Leaderboard Table / Cards */}
          <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {GAMES.find((g) => g.id === selectedGame)?.name} - শীর্ষ স্কোরার
                </h3>
              </div>
              <Link
                to={`/games/${selectedGame}`}
                className="text-xs font-bold text-[#155EEF] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                নিজে খেলুন
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.length === 0 ? (
                <div className="text-center py-10">
                  <Gamepad2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    এখনও কোনো স্কোর রেকর্ড হয়নি
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    প্রথম হয়ে লিডারবোর্ডের শীর্ষে আপনার নাম লিখুন!
                  </p>
                </div>
              ) : (
                leaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <div
                      key={entry.user_id}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        isTop1
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : isTop2
                          ? 'bg-slate-50/50 dark:bg-slate-800/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                              : isTop2
                              ? 'bg-slate-300 text-slate-900'
                              : isTop3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isTop1 ? <Crown className="w-4 h-4" /> : entry.rank}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                            {(entry.user_name || entry.display_name || entry.username || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{entry.user_name || entry.display_name || entry.username}</span>
                              {isTop1 && (
                                <span className="text-[10px] bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold px-1.5 py-0.5 rounded-sm">
                                  চ্যাম্পিয়ন
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-slate-400 font-mono">
                              মোট সেশন: {entry.games_played} টি
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-[#155EEF] dark:text-[#38BDF8]">
                          {entry.high_score.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400">সর্বোচ্চ স্কোর</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Achievements Showcase Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all ${
                ach.unlocked
                  ? 'bg-white dark:bg-[#151D2C] border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    ach.unlocked
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-400/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 grayscale'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {ach.title}
                    </h4>
                    {ach.unlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        আনলকড
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        লকড
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {ach.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">
                      অগ্রগতি: {ach.progress} / {ach.max_progress}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      +{ach.reward_coins} ডেমো কয়েন
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ach.unlocked ? 'bg-emerald-500' : 'bg-[#155EEF]'
                      }`}
                      style={{
                        width: `${Math.min(100, ((ach.progress ?? (ach.unlocked ? 1 : 0)) / (ach.max_progress ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
