/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface CarRacingGameProps {
  onBack?: () => void;
  onCoinsEarned?: (coins: number) => void;
}

export const CarRacingGame: React.FC<CarRacingGameProps> = ({ onBack, onCoinsEarned }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [coinsReward, setCoinsReward] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game internal state
  const playerXRef = useRef(150); // 0 to 300
  const obstaclesRef = useRef<{ x: number; y: number; speed: number; color: string }[]>([]);
  const coinsRef = useRef<{ x: number; y: number }[]>([]);
  const scoreRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef(0);

  const currentUserId = user?.id || 'user-me';

  const startGame = () => {
    playerXRef.current = 135;
    obstaclesRef.current = [];
    coinsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setCoinsReward(0);
    setGameState('playing');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerXRef.current = Math.max(25, playerXRef.current - 35);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerXRef.current = Math.min(245, playerXRef.current + 35);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const moveLeft = () => {
    playerXRef.current = Math.max(25, playerXRef.current - 35);
  };

  const moveRight = () => {
    playerXRef.current = Math.min(245, playerXRef.current + 35);
  };

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastObstacleTime = Date.now();
    let lastCoinTime = Date.now();
    let speed = 4;

    const loop = () => {
      const now = Date.now();

      // Spawn obstacle
      if (now - lastObstacleTime > Math.max(700, 1600 - scoreRef.current * 8)) {
        const laneX = [35, 105, 175, 245][Math.floor(Math.random() * 4)];
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];
        obstaclesRef.current.push({
          x: laneX,
          y: -50,
          speed: speed + Math.random() * 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        lastObstacleTime = now;
      }

      // Spawn coins
      if (now - lastCoinTime > 2200) {
        const laneX = [45, 115, 185, 255][Math.floor(Math.random() * 4)];
        coinsRef.current.push({ x: laneX, y: -30 });
        lastCoinTime = now;
      }

      // Update Road
      roadOffsetRef.current = (roadOffsetRef.current + speed) % 40;

      // Clear & Draw Road
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 300, 480);

      // Road grass borders
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, 0, 15, 480);
      ctx.fillRect(285, 0, 15, 480);

      // White lane dividers
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffsetRef.current;

      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 480);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(200, 0);
      ctx.lineTo(200, 480);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw Player Car
      const px = playerXRef.current;
      const py = 390;

      ctx.fillStyle = '#155EEF'; // Nilpha primary blue
      ctx.beginPath();
      ctx.roundRect(px, py, 30, 55, 6);
      ctx.fill();

      // Car windshield & wheels
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(px + 4, py + 12, 22, 12);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(px - 3, py + 6, 4, 12);
      ctx.fillRect(px + 29, py + 6, 4, 12);
      ctx.fillRect(px - 3, py + 36, 4, 12);
      ctx.fillRect(px + 29, py + 36, 4, 12);

      // Draw & Update Coins
      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const coin = coinsRef.current[i];
        coin.y += speed;

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('★', coin.x - 4, coin.y + 4);

        // Check player collision with coin
        if (
          Math.abs(coin.x - (px + 15)) < 22 &&
          Math.abs(coin.y - (py + 27)) < 25
        ) {
          coinsRef.current.splice(i, 1);
          scoreRef.current += 10;
          setScore(scoreRef.current);
          continue;
        }

        if (coin.y > 500) {
          coinsRef.current.splice(i, 1);
        }
      }

      // Draw & Update Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += obs.speed;

        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, 28, 50, 6);
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(obs.x - 3, obs.y + 6, 4, 10);
        ctx.fillRect(obs.x + 27, obs.y + 6, 4, 10);
        ctx.fillRect(obs.x - 3, obs.y + 34, 4, 10);
        ctx.fillRect(obs.x + 27, obs.y + 34, 4, 10);

        // Collision Check (AABB)
        if (
          px < obs.x + 28 &&
          px + 30 > obs.x &&
          py < obs.y + 50 &&
          py + 55 > obs.y
        ) {
          // Game Over
          handleGameOver(scoreRef.current);
          return;
        }

        if (obs.y > 500) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 2;
          setScore(scoreRef.current);
        }
      }

      speed = 4 + Math.min(6, Math.floor(scoreRef.current / 25));
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  const handleGameOver = async (finalScore: number) => {
    setGameState('gameover');
    try {
      const res = await gameService.recordGameSession({
        userId: currentUserId,
        gameId: 'car-racing',
        score: finalScore,
        durationSeconds: Math.max(10, Math.floor(finalScore / 2)),
      });
      setCoinsReward(res.coinsEarned);
      onCoinsEarned?.(res.coinsEarned);
    } catch (err) {
      console.warn('Could not record game session:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col items-center p-4 sm:p-6 animate-fade-in">
      {/* Top Controls */}
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
            মিনি কার রেসিং (Car Racing)
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-mono font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>স্কোর: {score}</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border-2 border-slate-700 bg-slate-900">
        <canvas ref={canvasRef} width={300} height={480} className="block" />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">হাইওয়ে কার চ্যালেঞ্জ</h3>
            <p className="text-xs text-slate-300 mb-6">
              বাধা গাড়ি এড়িয়ে স্টার কয়েন সংগ্রহ করুন। বাম ও ডানে সরার জন্য তীর বোতাম ব্যবহার করুন।
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>রেস শুরু করুন</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
            <h3 className="text-2xl font-black text-red-500 mb-1">দুর্ঘটনা! ক্র্যাশ</h3>
            <div className="text-4xl font-extrabold font-mono text-white mb-2">{score}</div>
            <p className="text-xs text-slate-300 mb-4">মোট অর্জিত পয়েন্ট</p>

            {coinsReward > 0 && (
              <div className="mb-6 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-2 text-xs font-bold">
                <Coins className="w-4 h-4" />
                <span>+{coinsReward} ডেমো কয়েন ওয়ালেটে যুক্ত হয়েছে!</span>
              </div>
            )}

            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>আবার খেলুন (Restart)</span>
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Touch Controls for Mobile */}
      <div className="w-full max-w-[300px] flex items-center justify-between gap-4 mt-4">
        <button
          onClick={moveLeft}
          disabled={gameState !== 'playing'}
          className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>বাম (Left)</span>
        </button>
        <button
          onClick={moveRight}
          disabled={gameState !== 'playing'}
          className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-40"
        >
          <span>ডান (Right)</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
