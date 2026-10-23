/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  X,
  History,
  Trash2,
  Users,
  FileText,
  Building,
  Flag,
  Radio,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { searchService } from '../services/searchService';
import { GlobalSearchResults, SearchCategory, GlobalSearchResultItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as SearchCategory) || 'all';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<SearchCategory>(tabParam);
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state with URL params
  useEffect(() => {
    if (queryParam !== query) {
      setQuery(queryParam);
    }
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [queryParam, tabParam]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  // Debounced execution of search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await searchService.searchGlobal(trimmed, activeTab, 25);
        setResults(res);
        if (res.totalCount > 0) {
          searchService.addRecentSearch(trimmed);
          setRecentSearches(searchService.getRecentSearches());
        }
      } catch (err: any) {
        setError(err?.message || 'সার্চ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), tab: activeTab });
    }
  };

  const handleSelectRecent = (item: string) => {
    setQuery(item);
    setSearchParams({ q: item, tab: activeTab });
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRemoveRecent = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    searchService.removeRecentSearch(item);
    setRecentSearches(searchService.getRecentSearches());
  };

  const handleClearAllRecent = () => {
    searchService.clearAllRecentSearches();
    setRecentSearches([]);
  };

  const handleTabChange = (newTab: SearchCategory) => {
    setActiveTab(newTab);
    if (query.trim()) {
      setSearchParams({ q: query.trim(), tab: newTab });
    }
  };

  const renderResultItem = (item: GlobalSearchResultItem) => {
    return (
      <Link
        key={`${item.type}-${item.id}`}
        to={item.action_url}
        className="group flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 hover:border-[#155EEF]/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200"
      >
        {/* Avatar or Icon */}
        <div className="shrink-0 relative">
          {item.avatar_url ? (
            <img
              src={item.avatar_url}
              alt={item.title}
              className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">
              {item.type === 'user' && <Users className="w-5 h-5" />}
              {item.type === 'post' && <FileText className="w-5 h-5" />}
              {item.type === 'group' && <Building className="w-5 h-5" />}
              {item.type === 'page' && <Flag className="w-5 h-5" />}
              {item.type === 'live' && <Radio className="w-5 h-5" />}
            </div>
          )}

          {item.type === 'live' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#155EEF] dark:group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>
            {item.metadata?.verified && (
              <CheckCircle2 className="w-4 h-4 text-[#155EEF] dark:text-blue-400 shrink-0" />
            )}
            <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              {item.type === 'user' && 'ব্যবহারকারী'}
              {item.type === 'post' && 'পোস্ট'}
              {item.type === 'group' && 'গ্রুপ'}
              {item.type === 'page' && 'পেইজ'}
              {item.type === 'live' && 'লাইভ'}
            </span>
          </div>

          {item.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {item.subtitle}
            </p>
          )}

          {item.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
      </Link>
    );
  };

  const getFilteredItems = (): GlobalSearchResultItem[] => {
    if (!results) return [];
    if (activeTab === 'users') return results.users;
    if (activeTab === 'posts') return results.posts;
    if (activeTab === 'groups') return results.groups;
    if (activeTab === 'pages') return results.pages;
    if (activeTab === 'live') return results.liveStreams;

    // 'all': Interleave results prioritizing users, posts, groups, pages, live
    return [
      ...results.users,
      ...results.posts,
      ...results.groups,
      ...results.pages,
      ...results.liveStreams,
    ];
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Search className="w-7 h-7 text-[#155EEF]" />
          গ্লোবাল সার্চ
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          ব্যবহারকারী, পোস্ট, পাবলিক গ্রুপ, পেইজ ও লাইভ স্ট্রিম দ্রুত খুঁজুন।
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#155EEF]" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, ইউজারনেম (@username), পোস্ট বা #হ্যাশট্যাগ লিখুন..."
            className="w-full pl-11 pr-12 py-3.5 text-base bg-white dark:bg-[#151D2C] border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] shadow-sm transition-all"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="মুছে ফেলুন"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Recent Searches (Show when no active query) */}
      {!query.trim() && recentSearches.length > 0 && (
        <div className="bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <History className="w-4 h-4 text-slate-400" />
              সাম্প্রতিক সার্চ ইতিহাস
            </div>
            <button
              onClick={handleClearAllRecent}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              সব মুছুন
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <span
                key={item}
                onClick={() => handleSelectRecent(item)}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#155EEF] transition-colors"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveRecent(e, item)}
                  className="text-slate-400 hover:text-red-500 p-0.5 rounded-full transition-colors"
                  aria-label={`Remove ${item}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'সব ফলাফল', icon: Sparkles },
            { id: 'users', label: 'ব্যবহারকারী', icon: Users, count: results?.users.length },
            { id: 'posts', label: 'পোস্ট ও হ্যাশট্যাগ', icon: FileText, count: results?.posts.length },
            { id: 'groups', label: 'গ্রুপ', icon: Building, count: results?.groups.length },
            { id: 'pages', label: 'পেইজ', icon: Flag, count: results?.pages.length },
            { id: 'live', label: 'লাইভ', icon: Radio, count: results?.liveStreams.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as SearchCategory)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#155EEF] text-white shadow-xs'
                    : 'bg-white dark:bg-[#151D2C] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Results Container */}
      {query.trim() && (
        <div className="space-y-3">
          {isLoading && !results && (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-[#155EEF] mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                অনুসন্ধান চলছে...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && results && filteredItems.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                কোনো ফলাফল পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                "{query}" এর জন্য কোনো তথ্য খুঁজে পাওয়া যায়নি। বানান যাচাই করুন বা অন্য কি-ওয়ার্ড দিয়ে চেষ্টা করুন।
              </p>
            </div>
          )}

          {!isLoading && results && filteredItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                <span>মোট {filteredItems.length} টি ফলাফল প্রদর্শিত হচ্ছে</span>
                <span>ফিল্টার: {activeTab === 'all' ? 'সকল বিভাগ' : activeTab}</span>
              </div>
              <div className="grid gap-2.5">
                {filteredItems.map(renderResultItem)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
