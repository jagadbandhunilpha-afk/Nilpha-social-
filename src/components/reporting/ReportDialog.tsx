/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Send,
  HelpCircle,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { ReportTargetType, ReportReasonCategory } from '../../types';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
  targetPreview?: {
    title?: string;
    content?: string;
    author_name?: string;
    author_username?: string;
  };
}

const REASONS: { category: ReportReasonCategory; titleBn: string; descBn: string }[] = [
  {
    category: 'spam',
    titleBn: 'স্প্যাম ও প্রতারণা (Spam / Scam)',
    descBn: 'অনাকাঙ্ক্ষিত বিজ্ঞাপনী লিংক, অর্থ দাবির প্রস্তাব বা ফিশিং প্রতারণা।',
  },
  {
    category: 'harassment',
    titleBn: 'হয়রানি ও অবমাননাকর মন্তব্য (Harassment)',
    descBn: 'ব্যক্তিগত আক্রমণ, কুৎসা রটনা বা কটূক্তিমূলক আচরণ।',
  },
  {
    category: 'hate_speech',
    titleBn: 'ঘৃণ্য বক্তব্য বা বিদ্বেষ ছড়ানো (Hate Speech)',
    descBn: 'ধর্ম, বর্ণ, সম্প্রদায় বা নির্দিষ্ট গোষ্ঠীর বিরুদ্ধে বিদ্বেষমূলক বক্তব্য।',
  },
  {
    category: 'violence_threats',
    titleBn: 'সহিংসতা ও প্রাণনাশের হুমকি (Violence / Threats)',
    descBn: 'শারীরিক ক্ষতি, হুমকি বা অস্ত্র প্রদর্শনের পোস্ট।',
  },
  {
    category: 'impersonation',
    titleBn: 'ভুয়া পরিচয় বা অনুকরণ (Impersonation)',
    descBn: 'অন্য কোনো ব্যক্তি বা প্রতিষ্ঠানের পরিচয় নকল করে তৈরি।',
  },
  {
    category: 'misinformation',
    titleBn: 'ভ্রান্ত তথ্য বা গুজব (Misinformation)',
    descBn: 'জনসাধারণকে বিভ্রান্ত করার উদ্দেশ্যে অসত্য তথ্য প্রচার।',
  },
  {
    category: 'copyright',
    titleBn: 'মেধাস্বত্ব বা কপিরাইট লঙ্ঘন (Copyright)',
    descBn: 'অনুমতি ছাড়া অন্যের সৃষ্টিশীল উপাদান প্রচার করা।',
  },
  {
    category: 'other',
    titleBn: 'অন্যান্য নীতিমালা লঙ্ঘন (Other)',
    descBn: 'প্ল্যাটফর্মের সাধারণ নীতিমালা পরিপন্থী কোনো কার্যক্রম।',
  },
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  reportedUserId,
  targetPreview,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReasonCategory>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const reporterId = user?.id || 'demo-user-1';
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await reportService.submitReport({
      reporterId,
      targetType,
      targetId,
      reportedUserId,
      reason: selectedReason,
      details,
      targetPreview,
    });

    setSubmitting(false);

    if (res.success) {
      if (res.isDuplicate) {
        setSuccessMessage('আপনি ইতিমধ্যে এই বিষয়টির জন্য একটি রিপোর্ট জমা দিয়েছেন। আমাদের মডারেটর টিম বিষয়টি পর্যালোচনা করছে।');
      } else {
        setSuccessMessage('আপনার রিপোর্টটি সফলভাবে মডারেশন টিমের কাছে পাঠানো হয়েছে। প্ল্যাটফর্মকে নিরাপদ রাখতে সহায়তা করার জন্য ধন্যবাদ।');
      }
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setDetails('');
      }, 2200);
    } else {
      setErrorMessage(res.error || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              রিপোর্ট করুন (মডারেশন রিভিউ)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview if available */}
        {targetPreview && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold block text-slate-700 dark:text-slate-300 mb-0.5">
              রিপোর্টকৃত বিষয় ({targetType.toUpperCase()}):
            </span>
            <p className="line-clamp-2 italic">"{targetPreview.content || targetPreview.title}"</p>
          </div>
        )}

        {successMessage ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-sm mx-auto">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                রিপোর্টের সুনির্দিষ্ট কারণ বেছে নিন:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {REASONS.map((r) => (
                  <label
                    key={r.category}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedReason === r.category
                        ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-white ring-1 ring-[#155EEF]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.category}
                      checked={selectedReason === r.category}
                      onChange={() => setSelectedReason(r.category)}
                      className="mt-0.5 text-[#155EEF] focus:ring-[#155EEF]"
                    />
                    <div>
                      <span className="font-bold block">{r.titleBn}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {r.descBn}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                অতিরিক্ত বিবরণ (ঐচ্ছিক):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="মডারেটরদের মূল বিষয়টি বুঝতে সাহায্য করার জন্য সংক্ষেপে ব্যাখ্যা লিখুন..."
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]"
              />
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                আপনার পরিচয় সম্পূর্ণ গোপন রাখা হবে। অভিযুক্ত ব্যক্তি জানতে পারবেন না কে রিপোর্ট করেছেন।
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট জমা দিন'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
