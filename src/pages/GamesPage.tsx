/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  AlertCircle,
  Trophy,
  Sparkles,
  Coins,
  ArrowRight,
  Flame,
  ArrowLeft,
  RotateCcw,
  History,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { gameService } from '../services/gameService';
import { GameSessionRecord } from '../types';

// Import the 6 playable mini games
import { CarRacingGame } from '../components/games/playable/CarRacingGame';
import { BubblePuzzleGame } from '../components/games/playable/BubblePuzzleGame';
import { FunnyRunnerGame } from '../components/games/playable/FunnyRunnerGame';
import { MemoryMatchGame } from '../components/games/playable/MemoryMatchGame';
import { TicTacToeGame } from '../components/games/playable/TicTacToeGame';
import { SevenUpGame } from '../components/games/playable/SevenUpGame';

interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  maxDailyCoins: number;
  isSpecialNotice?: boolean;
}

const GAMES: GameMetadata[] = [
  {
    id: 'game-racing',
    slug: 'car-racing',
    title: 'Mini Car Racing',
    titleBn: 'মিনি কার রেসিং',
    category: 'আর্কেড ও স্পিড',
    description: 'ট্রাফিকের ভেতর দিয়ে গাড়ি চালিয়ে কয়েন সংগ্রহ ও বাধা এড়িয়ে দীর্ঘতম দূরত্ব পাড়ি দিন!',
    icon: '🏎️',
    color: 'from-orange-500 to-red-600',
    maxDailyCoins: 30,
  },
  {
    id: 'game-bubble',
    slug: 'bubble-puzzle',
    title: 'Bubble Puzzle',
    titleBn: 'বাবল পাজল',
    category: 'ধাঁধা ও মেধা',
    description: 'একই রঙের ৩টি বা ততোধিক বাবল নিশানা করে ক্লাস্টার তৈরি করে বোর্ড খালি করুন!',
    icon: '🫧',
    color: 'from-cyan-500 to-blue-600',
    maxDailyCoins: 25,
  },
  {
    id: 'game-runner',
    slug: 'funny-runner',
    title: 'Funny Runner',
    titleBn: 'ফানি রানার',
    category: 'অ্যাকশন ও জাম্প',
    description: 'বাঁধা এড়িয়ে ডাবল-জাম্প দিয়ে লাফিয়ে কয়েন ধরুন এবং নতুন রেকর্ড তৈরি করুন!',
    icon: '🏃',
    color: 'from-purple-500 to-indigo-600',
    maxDailyCoins: 25,
  },
  {
    id: 'game-memory',
    slug: 'memory-match',
    title: 'Memory Match',
    titleBn: 'মেমরি ম্যাচ',
    category: 'স্মরণশক্তি',
    description: 'কার্ডের জোড়া মিলিয়ে স্মরণশক্তি পরীক্ষা করুন। কম চালে সব জোড়া মেলালে সর্বোচ্চ পয়েন্ট!',
    icon: '🃏',
    color: 'from-emerald-500 to-teal-600',
    maxDailyCoins: 20,
  },
  {
    id: 'game-tictactoe',
    slug: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    titleBn: 'টিক-ট্যাক-টো',
    category: 'স্ট্র্যাটেজি ও বুদ্ধিমত্তা',
    description: 'স্মার্ট বট অথবা বন্ধুর সাথে ৩x৩ গ্রিডে ক্লাসিক টিক-ট্যাক-টো দ্বৈরথ উপভোগ করুন!',
    icon: '❌',
    color: 'from-blue-600 to-indigo-700',
    maxDailyCoins: 20,
  },
  {
    id: 'game-sevenup',
    slug: 'seven-up',
    title: 'Seven Up Demo Arena',
    titleBn: 'সেভেন আপ ডেমো এরিনা',
    category: 'সংখ্যা অনুমান (ডেমো)',
    description: 'পাশার যোগফল ৭-এর কম, সমান বা বেশি হবে কি না অনুমান করার একটি অ-আর্থিক ডেমো বোর্ড।',
    icon: '🎲',
    color: 'from-amber-500 to-yellow-600',
    maxDailyCoins: 50,
    isSpecialNotice: true,
  },
];

export const GamesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'hub' | 'history'>('hub');
  const [walletBalance, setWalletBalance] = useState<number>(200);
  const [gameHistory, setGameHistory] = useState<GameSessionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load wallet balance and recent game history
  const loadData = async () => {
    try {
      const [wallet, sessions] = await Promise.all([
        walletService.getWallet(userId),
        gameService.getGameSessions(userId),
      ]);
      setWalletBalance(wallet.balance);
      setGameHistory(sessions);
    } catch (e) {
      console.error('Failed to load games hub data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, gameId]);

  // Determine active game to render based on URL parameter
  const currentGame = gameId
    ? GAMES.find((g) => g.slug === gameId || g.id === gameId)
    : null;

  const handleCoinsEarned = (coins: number) => {
    setWalletBalance((prev) => prev + coins);
    loadData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={t('gamesTitle')}
        subtitle="৬টি মজার ও চ্যালেঞ্জিং মিনি গেম, ডেমো কয়েন রিওয়ার্ড এবং লিডারবোর্ড"
        kicker="বিনোদন ও আর্কেড জোন"
      />

      {/* Prominent Legal / Non-Cash Disclaimer */}
      <DemoNotice
        message="সকল গেম সম্পূর্ণ ফ্রি ও সামাজিক বিনোদনমূলক। এখানে কোনো আসল নগদ টাকা বা জুয়ার লেনদেন নেই।"
      />

      {/* Top Bar with Balance and Navigation Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              উপলব্ধ ডেমো কয়েন
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {walletBalance.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">কয়েন</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>লিডারবোর্ড</span>
          </Link>

          <Link
            to="/rewards"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>দৈনিক বোনাস</span>
          </Link>

          <Link
            to="/wallet"
            className="px-3.5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>ওয়ালেট</span>
          </Link>
        </div>
      </div>

      {/* If a game is active in route, render the playable game! */}
      {currentGame ? (
        <div className="space-y-4">
          <button
            onClick={() => navigate('/games')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>গেম হাবে ফিরে যান</span>
          </button>

          {currentGame.slug === 'car-racing' && (
            <CarRacingGame
              onBack={() => navigate('/games')}
              onCoinsEarned={handleCoinsEarned}
            />
          )}

          {currentGame.slug === 'bubble-puzzle' && (
            <BubblePuzzleGame
              onBack={() => navigate('/games')}
              onCoinsEarned={handleCoinsEarned}
            />
          )}

          {currentGame.slug === 'funny-runner' && (
            <FunnyRunnerGame
              onBack={() => navigate('/games')}
              onCoinsEarned={handleCoinsEarned}
            />
          )}

          {currentGame.slug === 'memory-match' && (
            <MemoryMatchGame
              onBack={() => navigate('/games')}
              onCoinsEarned={handleCoinsEarned}
            />
          )}

          {currentGame.slug === 'tic-tac-toe' && (
            <TicTacToeGame
              onBack={() => navigate('/games')}
              onCoinsEarned={handleCoinsEarned}
            />
          )}

          {currentGame.slug === 'seven-up' && (
            <SevenUpGame
              onBack={() => navigate('/games')}
              onCoinsUpdated={(bal) => setWalletBalance(bal)}
            />
          )}
        </div>
      ) : (
        /* Games Hub Main View */
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('hub')}
              className={`py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'hub'
                  ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>সকল মিনি গেম (৬টি উপলব্ধ)</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>আমার খেলার ইতিহাস ({gameHistory.length})</span>
            </button>
          </div>

          {activeTab === 'hub' ? (
            /* 6 Playable Games Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {GAMES.map((game) => (
                <div
                  key={game.id}
                  className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Game Header Banner */}
                    <div className={`h-28 bg-gradient-to-r ${game.color} p-4 flex items-center justify-between relative`}>
                      <span className="text-4xl filter drop-shadow-md">{game.icon}</span>
                      <span className="px-2.5 py-1 rounded-full bg-black/20 text-white backdrop-blur-xs text-[11px] font-bold">
                        {game.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {game.titleBn}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {game.title}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                        {game.description}
                      </p>

                      {game.isSpecialNotice && (
                        <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>নন-ক্যাশ ডেমো কয়েন সিমুলেশন</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span>দৈনিক সর্বোচ্চ রিওয়ার্ড:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          +{game.maxDailyCoins} কয়েন
                          <Coins className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => navigate(`/games/${game.slug}`)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 group-hover:shadow-md"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>এখনই খেলুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* User Game Sessions History */
            <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 font-bold text-base text-slate-900 dark:text-white">
                আপনার সাম্প্রতিক গেম সেশনসমূহ
              </div>

              {gameHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Gamepad2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    এখনও কোনো গেম সেশন সম্পন্ন করেননি
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    উপরের যেকোনো একটি গেম নির্বাচন করে প্রথম স্কোর গড়ুন!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gameHistory.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] flex items-center justify-center font-bold text-xs uppercase">
                          {s.game_id.slice(0, 3)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                            {s.game_id.replace('-', ' ')}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(s.created_at).toLocaleString('bn-BD', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          স্কোর: {s.score}
                        </div>
                        {s.coins_rewarded > 0 && (
                          <div className="text-xs font-semibold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                            <span>+{s.coins_rewarded} কয়েন</span>
                            <Coins className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
