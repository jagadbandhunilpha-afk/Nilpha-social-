import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs mb-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-32" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
      </div>
      <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3" />
      <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
    </div>
  );
};
