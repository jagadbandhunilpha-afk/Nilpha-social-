import React, { useState } from 'react';
import { Users, Check, Plus, ExternalLink } from 'lucide-react';
import { CommunityItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';

interface CommunityCardProps {
  community: CommunityItem;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community }) => {
  const { t } = useLanguage();
  const { showToast, openNotice } = useNotice();
  const [joined, setJoined] = useState(community.joined);

  const handleToggle = () => {
    if (joined) {
      setJoined(false);
      showToast(
        community.type === 'group'
          ? 'গ্রুপ ত্যাগ করা হয়েছে (ডেমো)'
          : 'পেইজ আনফলো করা হয়েছে (ডেমো)'
      );
    } else {
      setJoined(true);
      showToast(
        community.type === 'group'
          ? 'গ্রুপে যুক্ত হয়েছেন (ডেমো)'
          : 'পেইজ অনুসরণ করছেন (ডেমো)'
      );
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Cover placeholder with clean subtle gradient */}
      <div className="h-24 bg-gradient-to-r from-blue-600/80 via-cyan-600/80 to-purple-600/80 p-3 flex justify-between items-start">
        <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-md">
          {community.type === 'group' ? t('tabGroups') : t('tabPages')} · ডেমো
        </span>
        <button
          onClick={() =>
            openNotice(
              community.name,
              'কমিউনিটি প্রিভিউ মোড।',
              'সম্পূর্ণ ফিড ও মেম্বার তালিকা পরবর্তী ধাপে সক্রিয় হবে।'
            )
          }
          className="text-white/80 hover:text-white p-1 rounded-md bg-black/20 hover:bg-black/30"
          title="বিস্তারিত দেখুন"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 -mt-9 mb-3">
          <div
            className={`w-12 h-12 rounded-xl ${community.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 border-2 border-white dark:border-[#151D2C] shadow-xs`}
          >
            {community.badgeLabel}
          </div>
          <div className="pt-4 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {community.name}
            </h3>
            {/* Zero-Pill unboxed text with separators */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>{community.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{community.membersDemoCount}</span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1 mb-4 line-clamp-2">
          {community.description}
        </p>

        {/* Action button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {joined ? 'সদস্য তালিকাভুক্ত (লোকাল)' : 'অনাবাসিক'}
          </span>
          <button
            onClick={handleToggle}
            className={`min-h-[38px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              joined
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                : 'bg-[#155EEF] hover:bg-[#1048C6] text-white shadow-xs'
            }`}
          >
            {joined ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>
                  {community.type === 'group' ? t('joinedGroup') : t('followingPage')}
                </span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {community.type === 'group' ? t('joinGroup') : t('followPage')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
