import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#155EEF] dark:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors border border-blue-200 dark:border-blue-900/60"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
