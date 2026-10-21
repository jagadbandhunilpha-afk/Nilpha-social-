import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Search,
  RotateCcw,
  RefreshCw,
  Hash,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { PostComposer } from '../components/home/PostComposer';
import { PostCard } from '../components/home/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { DemoNotice } from '../components/common/DemoNotice';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { fetchFeedPosts } from '../services/feedService';

const INITIAL_DEMO_POSTS: Post[] = [
  {
    id: 'demo-post-1',
    author: {
      name: 'তানভীর আহমেদ',
      handle: '@tanvir_ahmed',
      avatarColor: 'from-blue-600 to-indigo-600',
      initials: 'তা',
      role: 'সদস্য',
    },
    content: 'নিলফা সোশ্যালে আজ প্রথম পদার্পণ করলাম! বাংলাদেশের নিজস্ব প্ল্যাটফর্ম হিসেবে এর ইন্টারফেস ও গতি সত্যিই প্রশংসনীয়। আশা করি ভবিষ্যৎ ফিচারগুলোতে আমাদের কমিউনিটি আরও প্রাণবন্ত হয়ে উঠবে। 🇧🇩 #NilphaSocial #Bangladesh #TechBangla',
    timestamp: '১০ মিনিট আগে',
    category: 'টেক আলোচনা',
    likes: 24,
    comments: 5,
    shares: 2,
    likedByMe: false,
    bookmarkedByMe: false,
    mediaPlaceholder: {
      type: 'infographic',
      caption: 'নিলফা সোশ্যাল বাংলাদেশ — কমিউনিটি সংযোগ ও অগ্রগতি',
      color: 'bg-gradient-to-r from-blue-900/10 via-cyan-900/10 to-indigo-900/10 dark:from-blue-900/30 dark:to-cyan-900/30',
    },
    isDemo: true,
  },
  {
    id: 'demo-post-2',
    author: {
      name: 'সাবিহা সুলতানা',
      handle: '@sabiha_design',
      avatarColor: 'from-cyan-600 to-teal-600',
      initials: 'সা',
      role: 'ডিজাইনার',
    },
    content: 'ব্যবহারকারীর অভিজ্ঞতা ও ইন্টারফেস ডিজাইনে পরিষ্কার ও মার্জিত টাইপোগ্রাফি সবচেয়ে গুরুত্বপূর্ণ। নিলফা সোশ্যালের বাংলা ও ইংরেজি ফন্ট চয়েস দারুণ হয়েছে! মোবাইল ও ডেস্কটপ দুই জায়গাতেই দারুণ লাগছে। #Design #UXUI #Bangla',
    timestamp: '১ ঘণ্টা আগে',
    category: 'ডিজাইন',
    likes: 42,
    comments: 8,
    shares: 4,
    likedByMe: true,
    bookmarkedByMe: true,
    isDemo: true,
  },
  {
    id: 'demo-post-3',
    author: {
      name: 'সৌরভ চৌধুরী',
      handle: '@sourav_dev',
      avatarColor: 'from-purple-600 to-pink-600',
      initials: 'সৌ',
      role: 'ওয়েব ডেভেলপার',
    },
    content: 'একটি সফল সোস্যাল অ্যাপের মূল চাবিকাঠি হলো দ্রুত লোডিং ও রেস্পন্সিভ নেভিগেশন। পার্ট ৩-এ আসল পোস্ট প্রকাশ, মিডিয়া আপলোড এবং ডাটাবেজ ইন্টিগ্রেশন দেখে বেশ আশাবাদী লাগছে। #WebDev #Supabase #PostgreSQL',
    timestamp: '৩ ঘণ্টা আগে',
    category: 'প্রযুক্তি',
    likes: 19,
    comments: 3,
    shares: 1,
    likedByMe: false,
    bookmarkedByMe: false,
    isDemo: true,
  },
];

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlTag = searchParams.get('tag') || '';

  const [posts, setPosts] = useState<Post[]>(isConfigured ? [] : INITIAL_DEMO_POSTS);
  const [activeTab, setActiveTab] = useState<'latest' | 'following'>('latest');
  const [activeHashtag, setActiveHashtag] = useState<string | null>(urlTag || null);
  const [localSearch, setLocalSearch] = useState(urlQuery);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if URL query changes
  useEffect(() => {
    if (urlTag) {
      setActiveHashtag(urlTag);
    }
  }, [urlTag]);

  // Load feed from Supabase
  const loadFeed = useCallback(
    async (targetPage = 0, append = false) => {
      if (!isConfigured) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (targetPage === 0) {
        if (!append) setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setErrorMessage(null);

      try {
        const { posts: fetchedPosts, hasMore: moreAvailable, error } = await fetchFeedPosts({
          page: targetPage,
          limit: 10,
          currentUserId: user?.id,
          hashtag: activeHashtag || undefined,
          filter: activeTab,
        });

        if (error) {
          setErrorMessage(error.message || 'ফিডের তথ্য লোড করা যায়নি।');
        } else {
          setHasMore(moreAvailable);
          setPage(targetPage);
          if (append) {
            setPosts((prev) => [...prev, ...fetchedPosts]);
          } else {
            setPosts(fetchedPosts);
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'সার্ভার সংযোগে সমস্যা হয়েছে।');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [isConfigured, user?.id, activeHashtag, activeTab]
  );

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFeed(0, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadFeed(page + 1, true);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleHashtagClick = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '');
    setActiveHashtag(cleanTag);
    setSearchParams({ tag: cleanTag });
  };

  const handleClearHashtag = () => {
    setActiveHashtag(null);
    setSearchParams({});
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setActiveHashtag(null);
    setActiveTab('latest');
    setSearchParams({});
  };

  // Client-side text filter on current feed
  const displayedPosts = useMemo(() => {
    let result = posts;

    // Tab filtering for demo mode when supabase is offline
    if (!isConfigured && activeTab === 'following') {
      result = result.filter((p) => p.likes > 20 || p.likedByMe);
    }

    if (activeHashtag) {
      const tagLower = activeHashtag.toLowerCase();
      result = result.filter((p) => p.content.toLowerCase().includes(`#${tagLower}`));
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, isConfigured, activeTab, activeHashtag, localSearch]);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Welcome Banner */}
      <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#155EEF] dark:text-[#38BDF8] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>নিলফা সোশ্যাল বাংলাদেশ</span>
          </div>
          {isConfigured && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ফিড রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#155EEF]' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {t('welcomeTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {/* Supabase Status Notice */}
      {!isConfigured && <SupabaseConfigNotice className="mb-5" />}

      {/* Post Composer Card */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Feed Filter & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Feed tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => {
              setActiveTab('latest');
              setPage(0);
            }}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'latest'
                ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('feedLatest')}
          </button>
          <button
            onClick={() => {
              setActiveTab('following');
              setPage(0);
            }}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'following'
                ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('feedFollowing')}
          </button>
        </div>

        {/* Local Feed Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ফিডে খুঁজুন বা ফিল্টার..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Hashtag or Search Filter Pill */}
      {(activeHashtag || localSearch) && (
        <div className="flex items-center justify-between p-2.5 mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-2">
            {activeHashtag && (
              <span className="inline-flex items-center gap-1 font-semibold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                <Hash className="w-3 h-3 text-[#155EEF]" />
                {activeHashtag}
              </span>
            )}
            {localSearch && <span>অনুসন্ধান: &ldquo;{localSearch}&rdquo;</span>}
          </div>
          <button
            onClick={handleResetFilters}
            className="font-semibold underline hover:no-underline flex items-center gap-1 text-[#155EEF] dark:text-[#38BDF8]"
          >
            <RotateCcw className="w-3 h-3" />
            মুছে ফেলুন
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="w-4/5 h-3 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
              <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-red-200 dark:border-red-900/40 text-center mb-6">
          <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            ফিড লোড করতে সমস্যা হয়েছে
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            onClick={() => loadFeed(0, false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#155EEF] text-white hover:bg-[#1048C6] transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুনরায় চেষ্টা করুন (Retry)</span>
          </button>
        </div>
      )}

      {/* Post List or Empty State */}
      {!isLoading && !errorMessage && displayedPosts.length > 0 && (
        <div className="space-y-4">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onHashtagClick={handleHashtagClick}
            />
          ))}

          {/* Load More Button for Real Supabase Mode */}
          {isConfigured && hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#155EEF]" />
                    <span>পোস্ট লোড হচ্ছে...</span>
                  </>
                ) : (
                  <span>আরও পোস্ট দেখুন (Load More)</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty Feed State */}
      {!isLoading && !errorMessage && displayedPosts.length === 0 && (
        <EmptyState
          title={t('emptyFeedTitle')}
          description={
            localSearch || activeHashtag
              ? t('tryAnotherSearch')
              : t('emptyFeedDesc')
          }
          actionText={
            localSearch || activeHashtag
              ? 'ফিল্টার রিসেট করুন'
              : 'প্রথম পোস্ট তৈরি করুন'
          }
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};
