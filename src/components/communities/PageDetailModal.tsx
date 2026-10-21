/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Layers,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
  Plus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/communityService';
import { SocialPage } from '../../types';

interface PageDetailModalProps {
  page: SocialPage | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const PageDetailModal: React.FC<PageDetailModalProps> = ({
  page,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentUserId = user?.id || 'current-user';

  if (!isOpen || !page) return null;

  const isFollowing = !!page.isFollowing;
  const isOwnerOrAdmin = page.currentUserRole === 'admin';

  const handleFollowToggle = async () => {
    try {
      setIsActionLoading(true);
      setActionMessage(null);
      if (isFollowing) {
        await communityService.unfollowPage(page.id, currentUserId);
        setActionMessage(language === 'bn' ? 'পেইজটি আনফলো করা হয়েছে।' : 'Unfollowed page.');
      } else {
        await communityService.followPage(page.id, currentUserId);
        setActionMessage(language === 'bn' ? 'আপনি সফলভাবে পেইজটি ফলো করেছেন।' : 'Followed page.');
      }
      onUpdate();
    } catch (err: any) {
      console.error(err);
      setActionMessage(err.message || 'Operation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 relative p-4 flex items-start justify-between">
          <span className="text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{page.category || 'অফিসিয়াল পেইজ'}</span>
          </span>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Page Profile Header */}
        <div className="px-6 pt-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{page.name}</h2>
                {isOwnerOrAdmin && (
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{language === 'bn' ? 'মালিক / অ্যাডমিন' : 'Admin'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">nilpha.social/p/{page.slug}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {page.follower_count.toLocaleString()} {language === 'bn' ? 'অনুসারী (Followers)' : 'followers'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(page.created_at).toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <button
              onClick={handleFollowToggle}
              disabled={isActionLoading}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                isFollowing
                  ? 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-[#155EEF] hover:bg-[#1048C6] text-white'
              }`}
            >
              {isActionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ফলো করুন' : 'Follow Page'}</span>
                </>
              )}
            </button>
          </div>

          {actionMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {page.website && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-4 h-4 text-slate-400" />
              <a
                href={page.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#155EEF] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                <span>{page.website}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'bn' ? 'পেইজের বিবরণ' : 'Page Description'}
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {page.description || (language === 'bn' ? 'কোনো বিবরণ যোগ করা হয়নি।' : 'No description provided.')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'bn' ? 'ভূমিকা ও অধিকার (Role Permissions)' : 'Roles & Permissions'}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'bn'
                ? 'পেইজের অ্যাডমিন বা এডিটররা পোস্ট প্রকাশ ও আপডেট করতে পারেন। সাধারণ ব্যবহারকারীরা পেইজ ফলো করে সর্বশেষ আপডেট তাদের ফিডে দেখতে পারেন।'
                : 'Page admins and editors can publish posts and updates. Normal users follow the page to receive updates directly into their feed.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
