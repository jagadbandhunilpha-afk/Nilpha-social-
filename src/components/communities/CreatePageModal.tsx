/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Layers, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CreatePageInput } from '../../types';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePageInput) => Promise<void>;
}

const CATEGORIES = [
  'প্রযুক্তি ও গ্যাজেট',
  'ব্যবসা ও উদ্যোক্তা',
  'শিক্ষা ও ক্যারিয়ার',
  'খাবার ও রেসিপি',
  'ভ্রমণ ও পর্যটন',
  'সাহিত্য ও সংস্কৃতি',
  'সংবাদ ও মিডিয়া',
  'বিনোদন ও গেমিং',
  'অন্যান্য',
];

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { language, t } = useLanguage();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-')) {
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
      setError(language === 'bn' ? 'পেইজের নাম প্রদান করুন।' : 'Please enter a page name.');
      return;
    }
    if (!slug.trim()) {
      setError(language === 'bn' ? 'ইউনিক স্লাগ প্রদান করুন।' : 'Please enter a unique page slug.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        category,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
      });
      setName('');
      setSlug('');
      setDescription('');
      setWebsite('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'bn' ? 'পেইজ তৈরি করতে ব্যর্থ হয়েছে।' : 'Failed to create page.'));
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
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন অফিসিয়াল পেইজ তৈরি করুন' : 'Create New Page'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'আপনার ব্যবসা, ব্র্যান্ড, বা উদ্যোগের অফিশিয়াল পরিচয়'
                  : 'Establish official presence for your brand, business or creator profile'}
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
              {language === 'bn' ? 'পেইজের নাম' : 'Page Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: ঢাকা টেক ল্যাব' : 'e.g. Dhaka Tech Lab'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'ইউনিক স্লাগ (URL Handle)' : 'Unique Slug / URL'} *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700">
                nilpha.social/p/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="dhaka-tech-lab"
                className="w-full px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'ওয়েবসাইট লিংক (ঐচ্ছিক)' : 'Website (Optional)'}
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'পেইজের বিবরণ' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'bn' ? 'পেইজের লক্ষ্য ও কার্যক্রম সংক্ষেপে লিখুন...' : 'Briefly describe your page...'}
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
              <span>{language === 'bn' ? 'পেইজ তৈরি করুন' : 'Create Page'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
