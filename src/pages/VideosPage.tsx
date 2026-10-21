import React, { useState, useMemo } from 'react';
import { Play, Search, X, Film, Sparkles, Clock, Eye } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';
import { VideoItem } from '../types';

const DEMO_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'বাংলাদেশের প্রাকৃতিক রূপ ও সুন্দরবনের রোমাঞ্চকর তথ্যচিত্র',
    creator: 'সবুজ বাংলাদেশ মিডিয়া',
    duration: '০৮:৪৫',
    category: 'foryou',
    viewsDemo: '১৪.২k ডেমো ভিউ',
    timeAgo: '২ দিন আগে',
    color: 'from-emerald-700 to-teal-900',
    icon: 'nature',
  },
  {
    id: 'vid-2',
    title: 'আধুনিক ওয়েব ডেভেলপমেন্ট ও ইউআই/ইউএক্স সেরা কলাকৌশল',
    creator: 'কোড উইথ তানভীর',
    duration: '১২:৩০',
    category: 'trending',
    viewsDemo: '২৮.৫k ডেমো ভিউ',
    timeAgo: '৫ ঘণ্টা আগে',
    color: 'from-blue-700 to-indigo-950',
    icon: 'tech',
  },
  {
    id: 'vid-3',
    title: 'ঢাকা শহরের ঐতিহ্যবাহী কাচ্চি বিরিয়ানি তৈরির নেপথ্য গল্প',
    creator: 'ফুড অ্যান্ড কালচার বিডি',
    duration: '০৫:১৫',
    category: 'trending',
    viewsDemo: '৪১.০k ডেমো ভিউ',
    timeAgo: '১ দিন আগে',
    color: 'from-amber-700 to-orange-950',
    icon: 'food',
  },
  {
    id: 'vid-4',
    title: 'ফ্রিল্যান্সিং ক্যারিয়ার শুরুর প্রস্তুতি ও সঠিক ফ্রেমওয়ার্ক',
    creator: 'ক্যারিয়ার গাইডলাইন বাংলা',
    duration: '১৫:২০',
    category: 'following',
    viewsDemo: '৯.৭k ডেমো ভিউ',
    timeAgo: '৩ দিন আগে',
    color: 'from-purple-700 to-slate-900',
    icon: 'career',
  },
  {
    id: 'vid-5',
    title: 'বাংলাদেশ ক্রিকেট দলের সাম্প্রতিক অনুশীলন ও কৌশল বিশ্লেষণ',
    creator: 'স্পোর্টস কর্নার বিডি',
    duration: '০৭:১০',
    category: 'foryou',
    viewsDemo: '৩২.১k ডেমো ভিউ',
    timeAgo: '৪ ঘণ্টা আগে',
    color: 'from-cyan-700 to-blue-950',
    icon: 'sports',
  },
  {
    id: 'vid-6',
    title: 'রবীন্দ্রসঙ্গীতের আধুনিক সুরবিন্যাস ও বাদ্যযন্ত্রের সংমিশ্রণ',
    creator: 'সুর সঙ্গীত একাডেমি',
    duration: '০৬:৪০',
    category: 'following',
    viewsDemo: '৬.৩k ডেমো ভিউ',
    timeAgo: '৪ দিন আগে',
    color: 'from-rose-700 to-purple-950',
    icon: 'music',
  },
];

export const VideosPage: React.FC = () => {
  const { t } = useLanguage();
  const { openNotice } = useNotice();
  const [activeTab, setActiveTab] = useState<'foryou' | 'trending' | 'following'>('foryou');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = useMemo(() => {
    return DEMO_VIDEOS.filter((video) => {
      const matchesCategory =
        activeTab === 'foryou' || video.category === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const handlePlayVideo = (video: VideoItem) => {
    openNotice(
      video.title,
      'ভিডিও প্লেয়ার স্ট্রিম ইঞ্জিন পরবর্তী ডেভেলপমেন্ট ধাপে যুক্ত হবে।',
      `নির্মাতা: ${video.creator} · সময়কাল: ${video.duration} · কোনো বাহ্যিক স্ট্রিম লোড করা হয়নি।`
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t('videosTitle')}
        subtitle={t('videosSubtitle')}
        kicker="ভিডিও ডিসকভারি"
      />

      <DemoNotice
        className="mb-6"
        message={t('videoNotice')}
      />

      {/* Controls Bar: Search & Category Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        {/* Category tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setActiveTab('foryou')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'foryou'
                ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('tabForYou')}
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'trending'
                ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('tabTrending')}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'following'
                ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('tabFollowingVideos')}
          </button>
        </div>

        {/* Search input UI */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchVideos')}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handlePlayVideo(video)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Thumbnail Placeholder container */}
              <div
                className={`relative aspect-video bg-gradient-to-tr ${video.color} p-4 flex flex-col justify-between overflow-hidden`}
              >
                <div className="flex justify-between items-start z-10">
                  <span className="text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                    ডেমো কনটেন্ট
                  </span>
                </div>

                {/* Central Play Icon Overlay */}
                <div className="self-center my-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#155EEF] transition-all shadow-md">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>

                {/* Duration badge */}
                <div className="flex justify-end z-10">
                  <span className="text-[11px] font-mono tabular-nums text-white bg-black/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.duration}
                  </span>
                </div>
              </div>

              {/* Video metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#155EEF] dark:group-hover:text-[#38BDF8] transition-colors leading-snug mb-2">
                  {video.title}
                </h3>
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {video.creator}
                  </p>
                  {/* Zero-Pill unboxed text */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <span className="font-mono tabular-nums">{video.viewsDemo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{video.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('noResults')}
          description={t('tryAnotherSearch')}
          actionText="সব ভিডিও দেখুন"
          onAction={() => {
            setSearchQuery('');
            setActiveTab('foryou');
          }}
        />
      )}
    </div>
  );
};
