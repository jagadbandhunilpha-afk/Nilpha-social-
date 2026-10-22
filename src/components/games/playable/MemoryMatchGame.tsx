/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

const CARD_ITEMS = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥝'];

interface MemoryMatchGameProps {
  onBack?: () => void;
  onCoinsEarned?: (coins: number) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, onCoinsEarned }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [cards, setCards] = useState<string[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [coinsReward, setCoinsReward] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentUserId = user?.id || 'user-me';

  const initGame = () => {
    const pairDeck = [...CARD_ITEMS, ...CARD_ITEMS].sort(() => Math.random() - 0.5);
    setCards(pairDeck);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMoves(0);
    setIsVictory(false);
    setCoinsReward(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIndices.includes(index)) {
      return;
    }

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = nextFlipped;

      if (cards[first] === cards[second]) {
        // Matched
        const nextMatched = [...matchedIndices, first, second];
        setMatchedIndices(nextMatched);
        setFlippedIndices([]);

        // Check Victory
        if (nextMatched.length === cards.length) {
          handleVictory(moves + 1);
        }
      } else {
        // Not matched: flip back after 800ms
        setTimeout(() => {
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const handleVictory = async (finalMoves: number) => {
    setIsVictory(true);
    const calculatedScore = Math.max(10, 100 - finalMoves * 3);
    try {
      const res = await gameService.recordGameSession({
        userId: currentUserId,
        gameId: 'memory-match',
        score: calculatedScore,
        durationSeconds: 45,
      });
      setCoinsReward(res.coinsEarned);
      onCoinsEarned?.(res.coinsEarned);
    } catch (err) {
      console.warn('Game session record error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col items-center p-4 sm:p-6 animate-fade-in">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-5">
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
            মেমোরি ম্যাচ (Memory Match)
          </h2>
          <div className="flex items-center justify-center gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            <span>চাল: {moves}</span>
            <span>মেলেছে: {matchedIndices.length / 2}/8</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* 4x4 Cards Grid */}
      <div className="grid grid-cols-4 gap-2.5 w-full max-w-[340px] mb-5">
        {cards.map((emoji, idx) => {
          const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
          const isMatched = matchedIndices.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-2xl text-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-2xs select-none cursor-pointer ${
                isMatched
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-500 opacity-90 scale-95'
                  : isFlipped
                  ? 'bg-white dark:bg-slate-800 border-2 border-[#155EEF] scale-100'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-700 hover:scale-105 active:scale-95 text-transparent'
              }`}
            >
              {isFlipped ? emoji : '★'}
            </button>
          );
        })}
      </div>

      {/* Victory Screen */}
      {isVictory && (
        <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-4 text-center mb-4 animate-fade-in">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span>অভিনন্দন! সব জোড়া মিলে গেছে</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
            আপনি মাত্র {moves} চালে সম্পূর্ণ বোর্ড সমাধান করেছেন।
          </p>

          {coinsReward > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold mb-3">
              <Coins className="w-4 h-4" />
              <span>+{coinsReward} ডেমো কয়েন যোগ হয়েছে!</span>
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={initGame}
        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>নতুন গেম শুরু করুন (Reset)</span>
      </button>
    </div>
  );
};
