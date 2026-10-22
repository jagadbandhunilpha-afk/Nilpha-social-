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
} from 'lucide-react';
import { gameService } from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
const ROWS = 8;
const COLS = 8;
const BUBBLE_RADIUS = 16;

interface BubblePuzzleGameProps {
  onBack?: () => void;
  onCoinsEarned?: (coins: number) => void;
}

export const BubblePuzzleGame: React.FC<BubblePuzzleGameProps> = ({ onBack, onCoinsEarned }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [coinsReward, setCoinsReward] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Board grid: null for empty, string for color
  const gridRef = useRef<(string | null)[][]>([]);
  const currentBubbleColorRef = useRef<string>(COLORS[0]);
  const projectileRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string } | null>(null);
  const scoreRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const currentUserId = user?.id || 'user-me';

  const initBoard = () => {
    const grid: (string | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        if (r < 4) {
          grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
        } else {
          grid[r][c] = null;
        }
      }
    }
    gridRef.current = grid;
    currentBubbleColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
    projectileRef.current = null;
    scoreRef.current = 0;
    setScore(0);
    setCoinsReward(0);
  };

  const startGame = () => {
    initBoard();
    setGameState('playing');
  };

  const fireBubbleAt = (targetX: number, targetY: number) => {
    if (projectileRef.current || gameState !== 'playing') return;

    const startX = 144;
    const startY = 430;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);

    if (dy >= -20 || dist === 0) return; // Only shoot upwards

    const speed = 10;
    projectileRef.current = {
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      color: currentBubbleColorRef.current,
    };

    // Pick next bubble color
    currentBubbleColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    fireBubbleAt(x, y);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    fireBubbleAt(x, y);
  };

  // Find connected bubbles of same color using flood fill
  const findMatches = (startR: number, startC: number, color: string) => {
    const visited = new Set<string>();
    const matches: [number, number][] = [];
    const queue: [number, number][] = [[startR, startC]];
    visited.add(`${startR},${startC}`);

    const grid = gridRef.current;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      matches.push([r, c]);

      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];

      for (const [nr, nc] of neighbors) {
        if (
          nr >= 0 &&
          nr < ROWS &&
          nc >= 0 &&
          nc < COLS &&
          grid[nr][nc] === color &&
          !visited.has(`${nr},${nc}`)
        ) {
          visited.add(`${nr},${nc}`);
          queue.push([nr, nc]);
        }
      }
    }

    return matches;
  };

  // Animation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      // Clear canvas
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 288, 460);

      // Draw Grid Bubbles
      const grid = gridRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = grid[r][c];
          if (color) {
            const bx = c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + 16;
            const by = r * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + 16;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx, by, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
            ctx.fill();

            // Bubble highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(bx - 4, by - 4, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Shooter Base & Current Bubble
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(144, 440, 36, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = currentBubbleColorRef.current;
      ctx.beginPath();
      ctx.arc(144, 420, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Update & Draw Projectile
      const proj = projectileRef.current;
      if (proj) {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Bounce off left/right walls
        if (proj.x - BUBBLE_RADIUS <= 0 || proj.x + BUBBLE_RADIUS >= 288) {
          proj.vx = -proj.vx;
        }

        // Draw projectile
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Check collision with top wall or existing bubbles
        let collided = false;
        let snapR = 0;
        let snapC = 0;

        if (proj.y - BUBBLE_RADIUS <= 20) {
          collided = true;
          snapR = 0;
          snapC = Math.max(0, Math.min(COLS - 1, Math.floor((proj.x - 16) / (BUBBLE_RADIUS * 2))));
        } else {
          // Check collision with existing bubbles
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (grid[r][c]) {
                const bx = c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + 16;
                const by = r * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + 16;
                const d = Math.hypot(proj.x - bx, proj.y - by);
                if (d < BUBBLE_RADIUS * 1.8) {
                  collided = true;
                  snapR = Math.min(ROWS - 1, r + 1);
                  snapC = Math.max(0, Math.min(COLS - 1, Math.floor((proj.x - 16) / (BUBBLE_RADIUS * 2))));
                  break;
                }
              }
            }
            if (collided) break;
          }
        }

        if (collided) {
          // Snap bubble to grid
          if (snapR < ROWS && snapC < COLS && !grid[snapR][snapC]) {
            grid[snapR][snapC] = proj.color;

            // Check match 3 or more
            const matches = findMatches(snapR, snapC, proj.color);
            if (matches.length >= 3) {
              for (const [mr, mc] of matches) {
                grid[mr][mc] = null;
              }
              scoreRef.current += matches.length * 10;
              setScore(scoreRef.current);
            }
          }

          projectileRef.current = null;

          // Check Game Over condition (bubbles reached bottom line)
          const bottomHasBubbles = grid[ROWS - 2].some(Boolean) || grid[ROWS - 1].some(Boolean);
          if (bottomHasBubbles) {
            handleGameOver(scoreRef.current);
            return;
          }
        }
      }

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
        gameId: 'bubble-puzzle',
        score: finalScore,
        durationSeconds: 30,
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
            বাবল পাজল (Bubble Puzzle)
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-500 font-mono font-bold">
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
          width={288}
          height={460}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
          className="block cursor-crosshair"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">কালার বাবল শুটিং</h3>
            <p className="text-xs text-slate-300 mb-6">
              একই রঙের ৩টি বা তার বেশি বাবল নিশানা করে ফাটিয়ে বোর্ড খালি করুন।
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>পাজল শুরু করুন</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
            <h3 className="text-2xl font-black text-cyan-400 mb-1">খেলা সমাপ্ত!</h3>
            <div className="text-4xl font-extrabold font-mono text-white mb-2">{score}</div>
            <p className="text-xs text-slate-300 mb-4">মোট অর্জিত বাবল পয়েন্ট</p>

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

      <p className="text-xs text-slate-400 mt-3 text-center">
        নিশানা করতে স্ক্রিনে যেকোনো জায়গায় ক্লিক বা টাচ করুন
      </p>
    </div>
  );
};
