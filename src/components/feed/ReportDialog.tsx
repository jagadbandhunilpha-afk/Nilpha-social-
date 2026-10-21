import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2, Check } from 'lucide-react';
import { submitModerationReport } from '../../services/feedService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { ReportReason } from '../../types';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  commentId?: string;
  targetTitle?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  postId,
  commentId,
  targetTitle,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useNotice();

  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('রিপোর্ট করতে অনুগ্রহ করে সাইন ইন করুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { success, error } = await submitModerationReport({
      reporterId: user.id,
      postId,
      commentId,
      reason,
      details,
    });

    if (error || !success) {
      setErrorMessage(error?.message || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে।');
    } else {
      showToast('আপনার রিপোর্ট সফলভাবে মডারেশন টিমের কাছে পাঠানো হয়েছে।');
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2 text-red-600 dark:text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            কনটেন্ট রিপোর্ট করুন
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {targetTitle ? `"${targetTitle}" বিষয়ে রিপোর্ট জমা দিন।` : 'কমিউনিটি নির্দেশিকা লঙ্ঘনের রিপোর্ট করুন।'}
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              রিপোর্টের কারণ নির্বাচন করুন
            </label>
            <div className="space-y-2">
              {[
                { value: 'spam', label: 'স্প্যাম বা অবাঞ্ছিত বিজ্ঞাপন (Spam)' },
                { value: 'harassment', label: 'হয়রানি বা উস্কানিমূলক আচরণ (Harassment)' },
                { value: 'impersonation', label: 'ভুয়া পরিচয় বা প্রতারণা (Impersonation)' },
                { value: 'inappropriate', label: 'অনুপযুক্ত বা ক্ষতিকর কনটেন্ট (Inappropriate)' },
                { value: 'other', label: 'অন্যান্য (Other)' },
              ].map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                    reason === r.value
                      ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/40 text-[#155EEF] dark:text-[#38BDF8] font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value as ReportReason)}
                    className="text-[#155EEF] focus:ring-[#155EEF]"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              অতিরিক্ত বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="কী সমস্যা হচ্ছে বিস্তারিত লিখুন..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>রিপোর্ট জমা দিন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
