import React, { useState } from 'react';
import { Gamepad2, AlertCircle, X, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { GameCard } from '../components/games/GameCard';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { GameItem } from '../types';

const GAMES_LIST: GameItem[] = [
  {
    id: 'game-tictactoe',
    title: 'Tic-Tac-Toe (টিক-ট্যাক-টো)',
    description: 'বন্ধুর সাথে অথবা এককভাবে বুদ্ধির লড়াই! ৩x৩ গ্রিডে ৩টি চিহ্ন এক সারিতে মিলিয়ে জয় নিশ্চিত করুন।',
    category: 'ক্লাসিক বোর্ড',
    color: 'bg-gradient-to-br from-blue-600 to-indigo-800',
    interactiveType: 'tictactoe',
  },
  {
    id: 'game-memory',
    title: 'Memory Match (স্মৃতি খেলা)',
    description: 'কার্ডের জোড়া মিলিয়ে নিজের স্মরণশক্তি ও একাগ্রতা পরীক্ষা করার সহজ ও আনন্দদায়ক খেলা।',
    category: 'ধাঁধা ও মেধা',
    color: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    interactiveType: 'memory',
  },
  {
    id: 'game-racing',
    title: 'Mini Car Racing (মিনি কার রেসিং)',
    description: 'গতি ও রিফ্লেক্সের পরীক্ষা! বাধা এড়িয়ে সর্বোচ্চ পয়েন্ট অর্জন করার উত্তেজনাপূর্ণ আর্কেড ড্রাইভ।',
    category: 'রেসিং ও স্পিড',
    color: 'bg-gradient-to-br from-orange-600 to-red-800',
    interactiveType: 'info',
  },
  {
    id: 'game-bubble',
    title: 'Bubble Puzzle (বাবল পাজল)',
    description: 'একই রঙের বাবলগুলো নিশানা করে ফাটিয়ে বোর্ড খালি করুন। শিথিলকারক গ্রাফিক্স ও সাউন্ড।',
    category: 'ধাঁধা ও মেধা',
    color: 'bg-gradient-to-br from-cyan-600 to-blue-800',
    interactiveType: 'info',
  },
  {
    id: 'game-runner',
    title: 'Funny Runner (ফানি রানার)',
    description: 'ছোট নদীর বাঁধ ও গ্রাম্য পথে মজার দৌড়। লাফিয়ে এবং নিচু হয়ে বাধা অতিক্রমের খেলা।',
    category: 'অ্যাকশন ও জাম্প',
    color: 'bg-gradient-to-br from-purple-600 to-indigo-900',
    interactiveType: 'info',
  },
  {
    id: 'game-sevenup',
    title: 'Seven Up Demo Arena (সেভেন আপ ডেমো)',
    description: 'পাশার সংখ্যার সম্ভাব্য যোগফল অনুমান করার একটি নিরীক্ষামূলক বিনোদনমূলক ডেমো বোর্ড।',
    category: 'সংখ্যা অনুমান (ডেমো)',
    color: 'bg-gradient-to-br from-amber-600 to-yellow-800',
    isSpecialNotice: true,
    noticeText: 'ডেমো গেম — বাস্তব টাকা বা নগদ পুরস্কার নেই।',
    interactiveType: 'info',
  },
];

export const GamesPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeGameModal, setActiveGameModal] = useState<GameItem | null>(null);

  // Tic Tac Toe State
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  // Memory Match State
  const initialCards = ['🍎', '🍌', '🍇', '🍉', '🍎', '🍌', '🍇', '🍉'];
  const [memoryCards] = useState<string[]>(() =>
    [...initialCards].sort(() => Math.random() - 0.5)
  );
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.every(Boolean) ? 'Draw' : null;
  };

  const handleSquareClick = (index: number) => {
    if (board[index] || calculateWinner(board)) return;
    const nextBoard = [...board];
    nextBoard[index] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);
    setIsXNext(!isXNext);
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first] === memoryCards[second]) {
        setMatchedIndices((prev) => [...prev, first, second]);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const resetMemory = () => {
    setFlippedIndices([]);
    setMatchedIndices([]);
  };

  const winner = calculateWinner(board);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t('gamesTitle')}
        subtitle={t('gamesSubtitle')}
        kicker="বিনোদন কেন্দ্র"
      />

      <DemoNotice
        className="mb-6"
        message="সকল গেম সম্পূর্ণ ফ্রি ও সামাজিক বিনোদনমূলক। এখানে কোনো আর্থিক লেনদেন বা ক্যাশ প্রাইজ যুক্ত নয়।"
      />

      {/* Grid of Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES_LIST.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={(g) => setActiveGameModal(g)}
          />
        ))}
      </div>

      {/* Interactive Game Play Modal */}
      {activeGameModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setActiveGameModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveGameModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close game"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold text-[#155EEF] dark:text-[#38BDF8] uppercase tracking-wider block">
                {activeGameModal.category}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {activeGameModal.title}
              </h3>
            </div>

            {/* Special Notice if Seven Up */}
            {activeGameModal.isSpecialNotice && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                <span>{activeGameModal.noticeText}</span>
              </div>
            )}

            {/* Game Content depending on interactive type */}
            {activeGameModal.interactiveType === 'tictactoe' && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {winner
                      ? winner === 'Draw'
                        ? 'ম্যাচ ড্র হয়েছে!'
                        : `বিজয়ী: ${winner}!`
                      : `পরবর্তী চাল: ${isXNext ? 'X' : 'O'}`}
                  </span>
                  <button
                    onClick={resetTicTacToe}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    রিসেট
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 w-64 mx-auto mb-4">
                  {board.map((cell, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSquareClick(idx)}
                      className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {cell}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeGameModal.interactiveType === 'memory' && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    মেলেছে: {matchedIndices.length / 2} / {initialCards.length / 2} জোড়া
                  </span>
                  <button
                    onClick={resetMemory}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    রিসেট
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 w-64 mx-auto mb-4">
                  {memoryCards.map((emoji, idx) => {
                    const isFlipped =
                      flippedIndices.includes(idx) || matchedIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCardClick(idx)}
                        className={`h-16 rounded-xl flex items-center justify-center text-2xl transition-all border ${
                          isFlipped
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isFlipped ? emoji : '❓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeGameModal.interactiveType === 'info' && (
              <div className="py-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] mx-auto mb-3 flex items-center justify-center">
                  <Trophy className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto mb-4 leading-relaxed">
                  {activeGameModal.description}
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 mb-4">
                  এই গেমটির লাইভ মাল্টিপ্লেয়ার ইঞ্জিন পার্ট ২-এ চালু হবে।
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveGameModal(null)}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
