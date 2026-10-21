import React from 'react';
import { Play, AlertCircle, Gamepad2 } from 'lucide-react';
import { GameItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface GameCardProps {
  game: GameItem;
  onPlay: (game: GameItem) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Game Visual / Header */}
      <div
        className={`h-36 ${game.color} p-4 flex flex-col justify-between relative overflow-hidden`}
      >
        <div className="flex items-center justify-between z-10">
          <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
            {game.category}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            <Gamepad2 className="w-4 h-4" />
          </div>
        </div>

        <div className="z-10">
          <h3 className="text-lg font-bold text-white drop-shadow-xs">
            {game.title}
          </h3>
        </div>

        {/* Subtle decorative geometric overlay */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Body info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {game.description}
        </p>

        {/* Special mandatory notice if applicable (e.g. Seven Up) */}
        {game.isSpecialNotice && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-amber-900 dark:text-amber-200 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold leading-tight">{game.noticeText}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {game.interactiveType === 'info' ? 'ইনফো প্রিভিউ' : 'ডেমো মোড'}
          </span>
          <button
            onClick={() => onPlay(game)}
            className="min-h-[40px] px-5 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('playGame')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
