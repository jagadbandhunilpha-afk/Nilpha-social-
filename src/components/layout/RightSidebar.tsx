import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';

export const RightSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { openNotice } = useNotice();

  const trendingTopics = [
    { tag: '#ডিজিটাল_বাংলাদেশ', count: '১২.৪k আলোচনা', category: 'প্রযুক্তি' },
    { tag: '#নিলফা_সোশ্যাল', count: '৮.১k আলোচনা', category: 'প্ল্যাটফর্ম' },
    { tag: '#বাংলাদেশ_ক্রিকেট', count: '১৫.২k আলোচনা', category: 'খেলাধুলা' },
    { tag: '#বাংলা_সাহিত্য', count: '৩.৮k আলোচনা', category: 'সংস্কৃতি' },
  ];

  const suggestedCommunities = [
    {
      name: 'ঢাকা টেক কমিউনিটি',
      members: '৪.২k সদস্য',
      initials: 'DT',
      color: 'bg-blue-600',
    },
    {
      name: 'বাংলাদেশি ফ্রিল্যান্সার ফোরাম',
      members: '১২.৮k সদস্য',
      initials: 'BF',
      color: 'bg-emerald-600',
    },
    {
      name: 'ফটোগ্রাফি ও ট্রাভেল বিডি',
      members: '৬.৫k সদস্য',
      initials: 'PT',
      color: 'bg-purple-600',
    },
  ];

  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto space-y-4 pl-1">
      {/* Platform Welcome & Status Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-100 dark:border-blue-900/40 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-[#155EEF] dark:text-[#38BDF8]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-wide uppercase">
            নিলফা সোশ্যাল ভিশন
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          বাংলাদেশের ব্যবহারকারীদের জন্য সম্পূর্ণ নিরাপদ ও আধুনিক সোশ্যাল আর্কিটেকচার।
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>পার্ট ১ · প্রজেক্ট ফাউন্ডেশন</span>
          <span aria-hidden="true">·</span>
          <span>UI রেডি</span>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-[#155EEF]" />
            <span>{t('rightPanelTrendingTitle')}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ডেমো</span>
        </div>

        <div className="space-y-3">
          {trendingTopics.map((topic, i) => (
            <div
              key={i}
              onClick={() =>
                openNotice(
                  topic.tag,
                  'এই ট্রেন্ডিং বিষয়ের পোস্টগুলো পরবর্তী ধাপে সার্ভার থেকে লোড হবে।',
                  'ডেমো ডেটা প্রদর্শন করা হয়েছে।'
                )
              }
              className="group cursor-pointer block p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                <span>{topic.category}</span>
                <span className="text-[11px] font-mono tabular-nums">{topic.count}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#155EEF] dark:group-hover:text-[#38BDF8] transition-colors">
                {topic.tag}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Users className="w-4 h-4 text-[#06B6D4]" />
            <span>{t('rightPanelCommunitiesTitle')}</span>
          </div>
          <Link
            to="/communities"
            className="text-xs text-[#155EEF] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
          >
            {t('viewAll')}
          </Link>
        </div>

        <div className="space-y-3">
          {suggestedCommunities.map((comm, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${comm.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  {comm.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {comm.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {comm.members}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  openNotice(
                    comm.name,
                    'কমিউনিটিতে যুক্ত হওয়ার অনুরোধ পাঠানো হয়েছে (ডেমো)।',
                    'সার্ভার ব্যাকএন্ড এখনো সক্রিয় নয়।'
                  )
                }
                className="shrink-0 px-2.5 py-1 text-xs font-semibold text-[#155EEF] dark:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/50"
              >
                {t('joinGroup')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
