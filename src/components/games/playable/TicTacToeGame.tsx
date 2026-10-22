/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  ArrowLeft,
  Bot,
  User,
  Sparkles,
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface TicTacToeGameProps {
  onBack?: () => void;
  onCoinsEarned?: (coins: number) => void;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ onBack, onCoinsEarned }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [mode, setMode] = useState<'bot' | 'pvp'>('bot');
  const [scoreTally, setScoreTally] = useState({ x: 0, o: 0, draw: 0 });
  const [coinsReward, setCoinsReward] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentUserId = user?.id || 'user-me';

  const checkWinner = (squares: (string | null)[]) => {
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
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return squares.every(Boolean) ? { winner: 'Draw', line: [] } : null;
  };

  const result = checkWinner(board);

  const handleSquareClick = (index: number) => {
    if (board[index] || result) return;

    const nextBoard = [...board];
    nextBoard[index] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);

    const outcome = checkWinner(nextBoard);
    if (outcome) {
      handleGameEnd(outcome.winner);
      return;
    }

    if (mode === 'bot' && isXNext) {
      setIsXNext(false);
      // Bot moves after 400ms
      setTimeout(() => {
        makeBotMove(nextBoard);
      }, 400);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const makeBotMove = (currentBoard: (string | null)[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    // 1. Check if bot can win
    for (const idx of emptyIndices) {
      const copy = [...currentBoard];
      copy[idx] = 'O';
      if (checkWinner(copy)?.winner === 'O') {
        finishBotMove(currentBoard, idx);
        return;
      }
    }

    // 2. Block player X win
    for (const idx of emptyIndices) {
      const copy = [...currentBoard];
      copy[idx] = 'X';
      if (checkWinner(copy)?.winner === 'X') {
        finishBotMove(currentBoard, idx);
        return;
      }
    }

    // 3. Take center if available
    if (currentBoard[4] === null) {
      finishBotMove(currentBoard, 4);
      return;
    }

    // 4. Random move
    const randomPick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    finishBotMove(currentBoard, randomPick);
  };

  const finishBotMove = (currentBoard: (string | null)[], pickIndex: number) => {
    const nextBoard = [...currentBoard];
    nextBoard[pickIndex] = 'O';
    setBoard(nextBoard);
    setIsXNext(true);

    const outcome = checkWinner(nextBoard);
    if (outcome) {
      handleGameEnd(outcome.winner);
    }
  };

  const handleGameEnd = async (winner: string) => {
    if (winner === 'X') {
      setScoreTally((prev) => ({ ...prev, x: prev.x + 1 }));
      try {
        const res = await gameService.recordGameSession({
          userId: currentUserId,
          gameId: 'tic-tac-toe',
          score: 50,
          durationSeconds: 20,
        });
        setCoinsReward(res.coinsEarned);
        onCoinsEarned?.(res.coinsEarned);
      } catch (err) {
        console.warn('Game session record error:', err);
      }
    } else if (winner === 'O') {
      setScoreTally((prev) => ({ ...prev, o: prev.o + 1 }));
    } else {
      setScoreTally((prev) => ({ ...prev, draw: prev.draw + 1 }));
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setCoinsReward(0);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col items-center p-4 sm:p-6 animate-fade-in">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
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
            টিক-ট্যাক-টো (Tic-Tac-Toe)
          </h2>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
            {result ? (
              result.winner === 'Draw' ? (
                'ম্যাচ ড্র হয়েছে!'
              ) : (
                `বিজয়ী: খেলোয়াড় ${result.winner} 🎉`
              )
            ) : (
              `চাল: খেলোয়াড় ${isXNext ? 'X' : 'O'}`
            )}
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-5 w-full max-w-[280px]">
        <button
          onClick={() => {
            setMode('bot');
            resetBoard();
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'bot'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-blue-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>বট বনাম আপনি</span>
        </button>

        <button
          onClick={() => {
            setMode('pvp');
            resetBoard();
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'pvp'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-blue-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>২ জন খেলোয়াড়</span>
        </button>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mb-5">
        {board.map((square, idx) => {
          const isWinningSquare = result?.line.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleSquareClick(idx)}
              className={`aspect-square rounded-2xl text-3xl font-black flex items-center justify-center select-none transition-all cursor-pointer shadow-2xs ${
                isWinningSquare
                  ? 'bg-emerald-500 text-white scale-105 shadow-md shadow-emerald-500/30'
                  : square
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                  : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#155EEF] hover:bg-blue-50/50'
              }`}
            >
              {square === 'X' && <span className="text-[#155EEF] dark:text-blue-400">X</span>}
              {square === 'O' && <span className="text-rose-500">O</span>}
            </button>
          );
        })}
      </div>

      {/* Result Coins Banner */}
      {coinsReward > 0 && (
        <div className="w-full max-w-[280px] mb-4 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 flex items-center justify-center gap-2 text-xs font-bold animate-fade-in">
          <Coins className="w-4 h-4" />
          <span>+{coinsReward} ডেমো কয়েন ওয়ালেটে জমা হয়েছে!</span>
        </div>
      )}

      {/* Scoreboard Tally */}
      <div className="flex items-center justify-between w-full max-w-[280px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs mb-5">
        <div className="text-center">
          <div className="text-slate-400 font-medium">প্লেয়ার X</div>
          <div className="font-bold text-sm text-[#155EEF]">{scoreTally.x}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 font-medium">ড্র</div>
          <div className="font-bold text-sm text-slate-600 dark:text-slate-300">{scoreTally.draw}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 font-medium">{mode === 'bot' ? 'রোবট O' : 'প্লেয়ার O'}</div>
          <div className="font-bold text-sm text-rose-500">{scoreTally.o}</div>
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={resetBoard}
        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>নতুন রাউন্ড শুরু করুন (Reset)</span>
      </button>
    </div>
  );
};
