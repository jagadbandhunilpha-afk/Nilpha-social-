import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center p-10 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-[#155EEF] mb-3" />
      <span className="text-sm font-medium">{message || t('loading')}</span>
    </div>
  );
};
