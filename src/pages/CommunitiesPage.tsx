/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Layers,
  Compass,
  Globe,
  Lock,
  ShieldCheck,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';
import { CreateGroupModal } from '../components/communities/CreateGroupModal';
import { CreatePageModal } from '../components/communities/CreatePageModal';
import { GroupDetailModal } from '../components/communities/GroupDetailModal';
import { PageDetailModal } from '../components/communities/PageDetailModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';
import {
  SocialGroup,
  SocialPage,
  CreateGroupInput,
  CreatePageInput,
} from '../types';

export const CommunitiesPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'groups' | 'pages' | 'my' | 'discover'>('groups');
  const [searchQuery, setSearchQuery] = useState('');

  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [pages, setPages] = useState<SocialPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SocialGroup | null>(null);
  const [selectedPage, setSelectedPage] = useState<SocialPage | null>(null);

  const currentUserId = user?.id || 'current-user';

  useEffect(() => {
    loadCommunities();
  }, [currentUserId]);

  const loadCommunities = async () => {
    try {
      setIsLoading(true);
      const [gList, pList] = await Promise.all([
        communityService.getGroups('all', currentUserId),
        communityService.getPages('all', currentUserId),
      ]);
      setGroups(gList);
      setPages(pList);
    } catch (err) {
      console.error('Error loading communities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (input: CreateGroupInput) => {
    await communityService.createGroup(input, currentUserId);
    await loadCommunities();
  };

  const handleCreatePage = async (input: CreatePageInput) => {
    await communityService.createPage(input, currentUserId);
    await loadCommunities();
  };

  // Filtered lists
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !searchQuery.trim() ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        g.slug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'my') {
        return g.currentUserMembership && g.currentUserMembership.status === 'active';
      }
      return true;
    });
  }, [groups, searchQuery, activeTab]);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'my') {
        return p.isFollowing || p.currentUserRole !== null;
      }
      return true;
    });
  }, [pages, searchQuery, activeTab]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={language === 'bn' ? 'কমিউনিটি, গ্রুপ ও পেইজ' : 'Communities, Groups & Pages'}
        subtitle={
          language === 'bn'
            ? 'পাবলিক ও প্রাইভেট গ্রুপে যোগ দিন, নিজস্ব পেইজ তৈরি করুন এবং সমমনা মানুষদের সাথে যুক্ত হোন'
            : 'Join public or private groups, create official pages, and connect with people around shared passions'
        }
        kicker={language === 'bn' ? 'পার্ট ৪ গ্রুপ ও পেইজ' : 'Part 4 Communities'}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'গ্রুপ তৈরি' : 'Create Group'}</span>
            </button>
            <button
              onClick={() => setIsCreatePageOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{language === 'bn' ? 'পেইজ তৈরি' : 'Create Page'}</span>
            </button>
          </div>
        }
      />

      {/* Supabase status notice if unconfigured */}
      {!isConfigured && <SupabaseConfigNotice className="mb-4" />}

      {/* Navigation tabs & search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'গ্রুপসমূহ' : 'Groups'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {groups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'pages'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অফিসিয়াল পেইজ' : 'Pages'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {pages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'my'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'আমার কমিউনিটি' : 'My Communities'}</span>
            </button>
          </div>

          <button
            onClick={loadCommunities}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'গ্রুপ বা পেইজের নাম, ক্যাটাগরি অথবা বিষয় দিয়ে খুঁজুন...'
                : 'Search groups or pages by title, topic, or keyword...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
          />
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#155EEF]" />
          <span className="text-xs">{language === 'bn' ? 'কমিউনিটি তালিকা লোড হচ্ছে...' : 'Loading communities...'}</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* GROUPS SECTION */}
          {(activeTab === 'groups' || activeTab === 'my') && (
            <div>
              {activeTab === 'my' && (
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#155EEF]" />
                  <span>{language === 'bn' ? 'যুক্ত থাকা গ্রুপসমূহ' : 'Joined Groups'}</span>
                </h3>
              )}

              {filteredGroups.length === 0 ? (
                activeTab === 'my' ? null : (
                  <EmptyState
                    icon={<Users className="w-7 h-7" />}
                    title={language === 'bn' ? 'কোনো গ্রুপ পাওয়া যায়নি' : 'No Groups Found'}
                    description={
                      language === 'bn'
                        ? 'আপনার পছন্দের বিষয়ে নতুন একটি গ্রুপ তৈরি করুন অথবা সার্চ ফিল্টার পরিবর্তন করুন।'
                        : 'Create a new group around your interests or adjust your search filter.'
                    }
                    actionText={language === 'bn' ? 'নতুন গ্রুপ তৈরি করুন' : 'Create Group'}
                    onAction={() => setIsCreateGroupOpen(true)}
                  />
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map((group) => {
                    const isMember = group.currentUserMembership?.status === 'active';
                    const isPending = group.currentUserMembership?.status === 'pending';
                    const role = group.currentUserMembership?.role;

                    return (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className="p-5 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#155EEF] dark:text-[#38BDF8] border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              {group.privacy === 'public' ? (
                                <>
                                  <Globe className="w-3 h-3" />
                                  <span>পাবলিক</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>প্রাইভেট</span>
                                </>
                              )}
                            </span>

                            {role === 'admin' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200">
                                অ্যাডমিন
                              </span>
                            ) : role === 'moderator' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                                মডারেটর
                              </span>
                            ) : isMember ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>সদস্য</span>
                              </span>
                            ) : isPending ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                অপেক্ষমাণ
                              </span>
                            ) : null}
                          </div>

                          {/* Group Title & Details */}
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                              {group.name[0]}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#155EEF] transition-colors line-clamp-1">
                                {group.name}
                              </h4>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                /g/{group.slug}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {group.description || 'কমিউনিটি আলোচনা ও পারস্পরিক সহযোগিতা।'}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            {group.member_count.toLocaleString()} সদস্য
                          </span>
                          <span className="text-xs font-semibold text-[#155EEF] dark:text-[#38BDF8] group-hover:underline">
                            বিবরণ দেখুন →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAGES SECTION */}
          {(activeTab === 'pages' || activeTab === 'my') && (
            <div>
              {activeTab === 'my' && (
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 mt-6 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>{language === 'bn' ? 'ফলো করা ও পরিচালিত পেইজসমূহ' : 'Followed & Managed Pages'}</span>
                </h3>
              )}

              {filteredPages.length === 0 ? (
                activeTab === 'my' ? (
                  filteredGroups.length === 0 ? (
                    <EmptyState
                      icon={<Compass className="w-7 h-7" />}
                      title={language === 'bn' ? 'কোনো কমিউনিটি যুক্ত নেই' : 'No Communities Joined'}
                      description={
                        language === 'bn'
                          ? 'গ্রুপ বা পেইজ ট্যাবে গিয়ে আকর্ষণীয় কমিউনিটিতে যোগ দিন।'
                          : 'Explore groups and pages to join exciting communities.'
                      }
                      actionText={language === 'bn' ? 'গ্রুপসমূহ খুঁজুন' : 'Explore Groups'}
                      onAction={() => setActiveTab('groups')}
                    />
                  ) : null
                ) : (
                  <EmptyState
                    icon={<Layers className="w-7 h-7" />}
                    title={language === 'bn' ? 'কোনো পেইজ পাওয়া যায়নি' : 'No Pages Found'}
                    description={
                      language === 'bn'
                        ? 'আপনার ব্র্যান্ড বা উদ্যোগের জন্য একটি নতুন পেইজ তৈরি করুন।'
                        : 'Create a brand or creator page to share official news.'
                    }
                    actionText={language === 'bn' ? 'পেইজ তৈরি করুন' : 'Create Page'}
                    onAction={() => setIsCreatePageOpen(true)}
                  />
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className="p-5 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {page.category || 'অফিসিয়াল'}
                          </span>

                          {page.currentUserRole === 'admin' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>মালিক / অ্যাডমিন</span>
                            </span>
                          ) : page.isFollowing ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>ফলো করছেন</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Page Details */}
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                            {page.name[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-1">
                              {page.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              /p/{page.slug}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {page.description || 'অফিসিয়াল আপডেট ও নিয়মিত প্রকাশনা।'}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {page.follower_count.toLocaleString()} অনুসারী
                        </span>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
                          বিস্তারিত দেখুন →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <CreatePageModal
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        onSubmit={handleCreatePage}
      />

      <GroupDetailModal
        group={selectedGroup}
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onUpdate={loadCommunities}
      />

      <PageDetailModal
        page={selectedPage}
        isOpen={!!selectedPage}
        onClose={() => setSelectedPage(null)}
        onUpdate={loadCommunities}
      />
    </div>
  );
};
