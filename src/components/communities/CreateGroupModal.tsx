/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, Globe, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CreateGroupInput, GroupPrivacy } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateGroupInput) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { language, t } = useLanguage();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-')) {
      // Auto-generate suggested slug
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 30)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(language === 'bn' ? 'গ্রুপের নাম প্রদান করুন।' : 'Please enter a group name.');
      return;
    }
    if (!slug.trim()) {
      setError(language === 'bn' ? 'গ্রুপের একটি ইউনিক স্লাগ (ইউজারনেম) দিন।' : 'Please enter a unique group slug.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        privacy,
      });
      setName('');
      setSlug('');
      setDescription('');
      setPrivacy('public');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'bn' ? 'গ্রুপ তৈরি করতে ব্যর্থ হয়েছে।' : 'Failed to create group.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন গ্রুপ তৈরি করুন' : 'Create New Group'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'কমিউনিটি গড়ে তুলুন ও সদস্যদের সাথে আলোচনা করুন'
                  : 'Build a community and collaborate with members'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'গ্রুপের নাম' : 'Group Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: ঢাকা ফ্রিল্যান্সার্স ক্লাব' : 'e.g. Dhaka Freelancers Hub'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'ইউনিক স্লাগ (URL Handle)' : 'Unique Slug / URL'} *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700">
                nilpha.social/g/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="dhaka-freelancers"
                className="w-full px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'গোপনীয়তা (Privacy)' : 'Privacy'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  privacy === 'public'
                    ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className={`w-4 h-4 ${privacy === 'public' ? 'text-[#155EEF]' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? 'পাবলিক গ্রুপ' : 'Public Group'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {language === 'bn' ? 'যে কেউ গ্রুপে যোগ দিতে ও পোস্ট পড়তে পারবে।' : 'Anyone can join and view posts.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  privacy === 'private'
                    ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className={`w-4 h-4 ${privacy === 'private' ? 'text-[#155EEF]' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? 'প্রাইভেট গ্রুপ' : 'Private Group'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {language === 'bn' ? 'অ্যাডমিনের অনুমোদন ছাড়া কেউ প্রবেশ করতে পারবে না।' : 'Only approved members can view.'}
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'বিবরণ ও নিয়মাবলি' : 'Description & Rules'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'bn' ? 'গ্রুপের মূল উদ্দেশ্য এবং নিয়মাবলী সংক্ষেপে লিখুন...' : 'Briefly describe your group...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{language === 'bn' ? 'গ্রুপ তৈরি করুন' : 'Create Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
