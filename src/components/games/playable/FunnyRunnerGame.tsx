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
  Sparkles,
  ArrowUp,
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface FunnyRunnerGameProps {
  onBack?: () => void;
  onCoinsEarned?: (coins: number) => void;
}

export const FunnyRunnerGame: React.FC<FunnyRunnerGameProps> = ({ onBack, onCoinsEarned }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [coinsReward, setCoinsReward] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player physics
  const playerYRef = useRef(320);
  const velocityYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const jumpCountRef = useRef(0);

  // Game elements
  const obstaclesRef = useRef<{ x: number; y: number; width: number; height: number; type: string }[]>([]);
  const starsRef = useRef<{ x: number; y: number }[]>([]);
  const scoreRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const groundOffsetRef = useRef(0);

  const currentUserId = user?.id || 'user-me';

  const jump = () => {
    if (jumpCountRef.current < 2) {
      velocityYRef.current = -12;
      isGroundedRef.current = false;
      jumpCountRef.current += 1;
    }
  };

  const startGame = () => {
    playerYRef.current = 320;
    velocityYRef.current = 0;
    isGroundedRef.current = true;
    jumpCountRef.current = 0;
    obstaclesRef.current = [];
    starsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setCoinsReward(0);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'playing') jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastObstacleTime = Date.now();
    let lastStarTime = Date.now();
    let speed = 4.5;

    const loop = () => {
      const now = Date.now();

      // Gravity & Jumping physics
      velocityYRef.current += 0.65; // gravity
      playerYRef.current += velocityYRef.current;

      const groundY = 320;
      if (playerYRef.current >= groundY) {
        playerYRef.current = groundY;
        velocityYRef.current = 0;
        isGroundedRef.current = true;
        jumpCountRef.current = 0;
      }

      // Spawn Obstacles (Hurdles / Crates)
      if (now - lastObstacleTime > Math.max(1200, 2200 - scoreRef.current * 8)) {
        const h = Math.random() > 0.5 ? 36 : 48;
        obstaclesRef.current.push({
          x: 360,
          y: groundY + 40 - h,
          width: 24,
          height: h,
          type: 'crate',
        });
        lastObstacleTime = now;
      }

      // Spawn Stars / Coins
      if (now - lastStarTime > 1800) {
        const starY = groundY - 20 - Math.random() * 50;
        starsRef.current.push({ x: 360, y: starY });
        lastStarTime = now;
      }

      // Clear & Draw Sky
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 360, 420);

      // Distant hills/riverbanks
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(100, 340, 80, Math.PI, 0);
      ctx.arc(260, 340, 110, Math.PI, 0);
      ctx.fill();

      // Draw Ground
      groundOffsetRef.current = (groundOffsetRef.current + speed) % 20;
      ctx.fillStyle = '#059669'; // Green bank
      ctx.fillRect(0, groundY + 40, 360, 60);

      ctx.fillStyle = '#047857';
      for (let x = -groundOffsetRef.current; x < 360; x += 20) {
        ctx.fillRect(x, groundY + 40, 10, 6);
      }

      // Draw Runner Player
      const px = 50;
      const py = playerYRef.current;

      // Character body
      ctx.fillStyle = '#7C3AED'; // Purple
      ctx.beginPath();
      ctx.roundRect(px, py, 26, 38, 6);
      ctx.fill();

      // Head
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(px + 13, py - 6, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cap
      ctx.fillStyle = '#155EEF';
      ctx.fillRect(px + 3, py - 16, 20, 6);

      // Running legs animation
      const legOffset = Math.sin(Date.now() / 80) * 8;
      ctx.fillStyle = '#1E293B';
      if (isGroundedRef.current) {
        ctx.fillRect(px + 4, py + 38, 6, 12 + legOffset);
        ctx.fillRect(px + 16, py + 38, 6, 12 - legOffset);
      } else {
        // Jumping legs tucked
        ctx.fillRect(px + 4, py + 38, 6, 8);
        ctx.fillRect(px + 16, py + 38, 6, 8);
      }

      // Draw & Update Stars
      for (let i = starsRef.current.length - 1; i >= 0; i--) {
        const star = starsRef.current[i];
        star.x -= speed;

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Collision check with runner
        if (
          Math.abs(star.x - (px + 13)) < 24 &&
          Math.abs(star.y - (py + 15)) < 28
        ) {
          starsRef.current.splice(i, 1);
          scoreRef.current += 15;
          setScore(scoreRef.current);
          continue;
        }

        if (star.x < -20) starsRef.current.splice(i, 1);
      }

      // Draw & Update Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speed;

        // Draw Wooden Crate / Hurdle
        ctx.fillStyle = '#92400E';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x + 2, obs.y + 2, obs.width - 4, obs.height - 4);

        // AABB Collision with runner
        const runnerBox = {
          x: px,
          y: py - 16,
          width: 26,
          height: 64,
        };

        if (
          runnerBox.x < obs.x + obs.width &&
          runnerBox.x + runnerBox.width > obs.x &&
          runnerBox.y < obs.y + obs.height &&
          runnerBox.y + runnerBox.height > obs.y
        ) {
          handleGameOver(scoreRef.current);
          return;
        }

        if (obs.x < -40) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 5;
          setScore(scoreRef.current);
        }
      }

      speed = 4.5 + Math.min(5, Math.floor(scoreRef.current / 40));
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  const handleGameOver = async (finalScore: number) => {
    setGameState('gameover');
    try {
      const res = await gameService.recordGameSession({
        userId: currentUserId,
        gameId: 'funny-runner',
        score: finalScore,
        durationSeconds: 25,
      });
      setCoinsReward(res.coinsEarned);
      onCoinsEarned?.(res.coinsEarned);
    } catch (err) {
      console.warn('Game session record error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col items-center p-4 sm:p-6 animate-fade-in">
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
            ফানি রানার (Funny Runner)
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-purple-500 font-mono font-bold">
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

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border-2 border-slate-700 bg-slate-900">
        <canvas
          ref={canvasRef}
          width={360}
          height={420}
          onClick={jump}
          className="block cursor-pointer"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">এন্ডলেস জাম্প রানার</h3>
            <p className="text-xs text-slate-300 mb-6">
              বাধা অতিক্রম করতে লাফ দিন। ডাবল জাম্পের জন্য দুইবার চাপুন।
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>দৌড় শুরু করুন</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
            <h3 className="text-2xl font-black text-purple-400 mb-1">ধাক্কা খেলেন!</h3>
            <div className="text-4xl font-extrabold font-mono text-white mb-2">{score}</div>
            <p className="text-xs text-slate-300 mb-4">মোট রান পয়েন্ট</p>

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

      {/* Jump Button for touch devices */}
      <div className="w-full max-w-[360px] mt-4">
        <button
          onClick={jump}
          disabled={gameState !== 'playing'}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
          <span>লাফ দিন (JUMP / ডাবল জাম্প)</span>
        </button>
      </div>
    </div>
  );
};
