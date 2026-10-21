import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'সমস্যা হয়েছে',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center my-4">
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mx-auto mb-3 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 max-w-md mx-auto mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>পুনরায় চেষ্টা করুন</span>
        </button>
      )}
    </div>
  );
};
