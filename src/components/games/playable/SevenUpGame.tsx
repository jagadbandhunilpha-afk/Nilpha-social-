/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Coins,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  History,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { walletService } from '../../../services/walletService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { SevenUpChoice, SevenUpRoundResult } from '../../../types';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

interface SevenUpGameProps {
  onBack?: () => void;
  onCoinsUpdated?: (newBalance: number) => void;
}

export const SevenUpGame: React.FC<SevenUpGameProps> = ({ onBack, onCoinsUpdated }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [walletBalance, setWalletBalance] = useState<number>(200);
  const [selectedChoice, setSelectedChoice] = useState<SevenUpChoice>('seven');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<SevenUpRoundResult | null>(null);
  const [roundHistory, setRoundHistory] = useState<SevenUpRoundResult[]>([]);
  const [diceDisplay, setDiceDisplay] = useState<[number, number]>([3, 4]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentUserId = user?.id || 'user-me';

  const loadBalance = async () => {
    try {
      const w = await walletService.getWallet(currentUserId);
      setWalletBalance(w.balance);
    } catch (err) {
      console.warn('Could not load wallet balance:', err);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [currentUserId]);

  const handleRollDice = async () => {
    if (isRolling) return;
    setErrorMsg(null);

    if (walletBalance < betAmount) {
      setErrorMsg('আপনার ওয়ালেটে পর্যাপ্ত ডেমো কয়েন নেই।');
      return;
    }

    setIsRolling(true);

    // Animate rolling dice faces for 1.2s
    const interval = setInterval(() => {
      setDiceDisplay([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 90);

    try {
      const result = await gameService.playSevenUpDemo(
        currentUserId,
        selectedChoice,
        betAmount
      );

      setTimeout(async () => {
        clearInterval(interval);
        setDiceDisplay([result.dice1, result.dice2]);
        setRoundResult(result);
        setRoundHistory((prev) => [result, ...prev.slice(0, 7)]);
        setIsRolling(false);

        await loadBalance();
        const delta = result.netCoins ?? (result.wonCoins - betAmount);
        onCoinsUpdated?.(walletBalance + delta);
      }, 1200);
    } catch (err: any) {
      clearInterval(interval);
      setIsRolling(false);
      setErrorMsg(err.message || 'রাউন্ড সম্পন্ন করা যায়নি।');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="text-center flex-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            সেভেন আপ ডেমো এরিনা (Seven Up Demo)
          </h2>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            নিরীক্ষামূলক নন-ক্যাশ বিনোদন বোর্ড
          </span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Mandatory Non-Cash Disclaimer */}
      <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold">নীতিগত স্পষ্টতা:</span> এই গেমটি সম্পূর্ণ ভার্চুয়াল ডেমো কয়েন দ্বারা পরিচালিত।
          এখানে কোনো আসল টাকা বা আর্থিক পুরস্কার নেই। ডেমো কয়েন হস্তান্তর বা উত্তোলনযোগ্য নয়।
        </div>
      </div>

      {/* Wallet Balance Display */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">আপনার ডেমো ব্যালেন্স</div>
            <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
              {walletBalance} কয়েন
            </div>
          </div>
        </div>

        <button
          onClick={loadBalance}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="রিফ্রেশ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Animated Dice Stage */}
      <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F19] to-slate-950 border border-slate-800 flex flex-col items-center justify-center relative shadow-inner mb-5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white text-slate-900 text-6xl flex items-center justify-center shadow-2xl transform transition-transform duration-100 hover:scale-105 border-4 border-slate-300 select-none">
            {DICE_FACES[diceDisplay[0] - 1]}
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white text-slate-900 text-6xl flex items-center justify-center shadow-2xl transform transition-transform duration-100 hover:scale-105 border-4 border-slate-300 select-none">
            {DICE_FACES[diceDisplay[1] - 1]}
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-300 font-mono">
          মোট যোগফল: <span className="font-bold text-base text-amber-400">{diceDisplay[0] + diceDisplay[1]}</span>
        </div>
      </div>

      {/* 7 Interactive Outcome Boxes */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          আপনার অনুমান নির্বাচন করুন (৩টি মূল সেগমেন্ট):
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Low */}
          <button
            onClick={() => setSelectedChoice('low')}
            className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
              selectedChoice === 'low'
                ? 'border-[#155EEF] bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] dark:text-blue-300 shadow-sm scale-102'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-black mb-0.5">৭ এর নিচে (2-6)</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">২ গুণ (2x)</div>
          </button>

          {/* Exact 7 */}
          <button
            onClick={() => setSelectedChoice('seven')}
            className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
              selectedChoice === 'seven'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 shadow-sm scale-102'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-black mb-0.5">লাকি ৭ (Exact 7)</div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">৫ গুণ (5x)</div>
          </button>

          {/* High */}
          <button
            onClick={() => setSelectedChoice('high')}
            className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
              selectedChoice === 'high'
                ? 'border-[#7C3AED] bg-purple-50 dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-300 shadow-sm scale-102'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-black mb-0.5">৭ এর উপরে (8-12)</div>
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">২ গুণ (2x)</div>
          </button>
        </div>
      </div>

      {/* Demo Bet Tokens */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          ডেমো কয়েন সংখ্যা:
        </label>
        <div className="flex items-center gap-2">
          {[5, 10, 20, 50].map((amt) => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                betAmount === amt
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {amt} কয়েন
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Play Button */}
      <button
        onClick={handleRollDice}
        disabled={isRolling || walletBalance < betAmount}
        className="w-full py-3.5 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer mb-5"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isRolling ? 'পাশা ঘুরছে...' : `পাশা রোল করুন (${betAmount} ডেমো কয়েন)`}</span>
      </button>

      {/* Round Result Card */}
      {roundResult && !isRolling && (
        <div
          className={`p-4 rounded-2xl border text-center mb-5 animate-fade-in ${
            roundResult.isWin
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="font-extrabold text-sm mb-1">
            {roundResult.isWin
              ? `অভিনন্দন! আপনার অনুমান সঠিক (${roundResult.sum})`
              : `এবার মেলেনি (যোগফল ছিল ${roundResult.sum})`}
          </div>

          <div className="text-xs font-bold font-mono">
            {roundResult.isWin
              ? `+${roundResult.coinsWon} ডেমো কয়েন অর্জিত হয়েছে!`
              : `-${roundResult.coinsBet} ডেমো কয়েন`}
          </div>

          <div className="mt-2 text-[10px] text-slate-400 font-mono truncate">
            {roundResult.randomProof}
          </div>
        </div>
      )}

      {/* History Log */}
      {roundHistory.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>সাম্প্রতিক ফলাফল লগ (স্বচ্ছ অডিট ট্রেইল):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {roundHistory.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono shrink-0 ${
                  h.isWin ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {h.sum} ({h.isWin ? `+${h.coinsWon}` : `-${h.coinsBet}`})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
