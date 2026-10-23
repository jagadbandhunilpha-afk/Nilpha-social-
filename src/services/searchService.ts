/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GlobalSearchResults, GlobalSearchResultItem, SearchCategory } from '../types';

const STORAGE_KEY_RECENT_SEARCHES = 'nilpha_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

export const searchService = {
  /**
   * Executes a global search across Users, Posts, Groups, Pages, and Live Streams.
   * Enforces privacy and public visibility restrictions.
   */
  async searchGlobal(
    query: string,
    category: SearchCategory = 'all',
    limit = 20
  ): Promise<GlobalSearchResults> {
    const cleanQuery = query.trim().slice(0, 100);
    if (!cleanQuery) {
      return {
        query: '',
        users: [],
        posts: [],
        groups: [],
        pages: [],
        liveStreams: [],
        totalCount: 0,
      };
    }

    const results: GlobalSearchResults = {
      query: cleanQuery,
      users: [],
      posts: [],
      groups: [],
      pages: [],
      liveStreams: [],
      totalCount: 0,
    };

    const shouldSearchUsers = category === 'all' || category === 'users';
    const shouldSearchPosts = category === 'all' || category === 'posts';
    const shouldSearchGroups = category === 'all' || category === 'groups';
    const shouldSearchPages = category === 'all' || category === 'pages';
    const shouldSearchLive = category === 'all' || category === 'live';

    if (isSupabaseConfigured && supabase) {
      try {
        const promises: PromiseLike<any>[] = [];

        // 1. Search Users
        if (shouldSearchUsers) {
          promises.push(
            supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url, bio, verification_status')
              .eq('account_status', 'active')
              .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
              .limit(limit)
              .then(({ data }) => {
                if (data) {
                  results.users = data.map((u) => ({
                    id: u.id,
                    type: 'user',
                    title: u.display_name,
                    subtitle: `@${u.username}`,
                    avatar_url: u.avatar_url,
                    description: u.bio || undefined,
                    action_url: `/profile/${u.username}`,
                    metadata: { verification_status: u.verification_status },
                  }));
                }
              })
          );
        }

        // 2. Search Public Posts (where deleted_at is null and visibility is public)
        if (shouldSearchPosts) {
          promises.push(
            supabase
              .from('posts')
              .select(`
                id,
                content,
                created_at,
                author:profiles(username, display_name, avatar_url)
              `)
              .is('deleted_at', null)
              .eq('visibility', 'public')
              .ilike('content', `%${cleanQuery}%`)
              .order('created_at', { ascending: false })
              .limit(limit)
              .then(({ data }) => {
                if (data) {
                  results.posts = data.map((p: any) => ({
                    id: p.id,
                    type: 'post',
                    title: p.author?.display_name || 'পোস্ট',
                    subtitle: p.author?.username ? `@${p.author.username}` : undefined,
                    avatar_url: p.author?.avatar_url,
                    description: p.content,
                    action_url: `/posts/${p.id}`,
                    metadata: { created_at: p.created_at },
                  }));
                }
              })
          );
        }

        // 3. Search Public Groups
        if (shouldSearchGroups) {
          promises.push(
            supabase
              .from('groups')
              .select('id, name, slug, description, avatar_url, member_count')
              .eq('visibility', 'public')
              .or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
              .limit(limit)
              .then(({ data }) => {
                if (data) {
                  results.groups = data.map((g) => ({
                    id: g.id,
                    type: 'group',
                    title: g.name,
                    subtitle: `${g.member_count || 1} সদস্য`,
                    avatar_url: g.avatar_url,
                    description: g.description || undefined,
                    action_url: `/communities`,
                  }));
                }
              })
          );
        }

        // 4. Search Public Pages
        if (shouldSearchPages) {
          promises.push(
            supabase
              .from('pages')
              .select('id, name, slug, category, description, avatar_url, followers_count')
              .or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
              .limit(limit)
              .then(({ data }) => {
                if (data) {
                  results.pages = data.map((pg) => ({
                    id: pg.id,
                    type: 'page',
                    title: pg.name,
                    subtitle: pg.category || `${pg.followers_count || 0} অনুসারী`,
                    avatar_url: pg.avatar_url,
                    description: pg.description || undefined,
                    action_url: `/communities`,
                  }));
                }
              })
          );
        }

        // 5. Search Active Live Streams
        if (shouldSearchLive) {
          promises.push(
            supabase
              .from('live_streams')
              .select(`
                id,
                title,
                description,
                viewer_count,
                host:profiles(username, display_name, avatar_url)
              `)
              .eq('status', 'live')
              .eq('visibility', 'public')
              .or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
              .limit(limit)
              .then(({ data }) => {
                if (data) {
                  results.liveStreams = data.map((s: any) => ({
                    id: s.id,
                    type: 'live',
                    title: s.title,
                    subtitle: `লাইভ • ${s.viewer_count || 1} জন দর্শক`,
                    avatar_url: s.host?.avatar_url,
                    description: s.description || undefined,
                    action_url: `/live/${s.id}`,
                  }));
                }
              })
          );
        }

        await Promise.all(promises);

        results.totalCount =
          results.users.length +
          results.posts.length +
          results.groups.length +
          results.pages.length +
          results.liveStreams.length;

        return results;
      } catch (err) {
        console.warn('Supabase searchGlobal error, using fallback:', err);
      }
    }

    // Local / Offline Fallback Dataset
    const lowerQuery = cleanQuery.toLowerCase();

    // Demo Users
    const demoUsers: GlobalSearchResultItem[] = [
      {
        id: 'user-tanvir',
        type: 'user',
        title: 'তানভীর আহমেদ',
        subtitle: '@tanvir_dev',
        avatar_url: null,
        description: 'সফটওয়্যার প্রকৌশলী এবং প্রযুক্তিপ্রেমী।',
        action_url: '/profile/tanvir_dev',
      },
      {
        id: 'user-nusrat',
        type: 'user',
        title: 'নুসরাত জাহান',
        subtitle: '@nusrat_jahan',
        avatar_url: null,
        description: 'ফটোগ্রাফি এবং ভ্রমণ অনুরাগী।',
        action_url: '/profile/nusrat_jahan',
      },
      {
        id: 'user-shariful',
        type: 'user',
        title: 'শরীফুল ইসলাম',
        subtitle: '@shariful_isl',
        avatar_url: null,
        description: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের শিক্ষার্থী।',
        action_url: '/profile/shariful_isl',
      },
      {
        id: 'user-farhan',
        type: 'user',
        title: 'ফারহান কবির',
        subtitle: '@farhan_k',
        avatar_url: null,
        description: 'ক্রীড়া ও সাইবার সিকিউরিটি বিশ্লেষক।',
        action_url: '/profile/farhan_k',
      },
    ];

    // Demo Posts
    const demoPosts: GlobalSearchResultItem[] = [
      {
        id: 'post-101',
        type: 'post',
        title: 'তানভীর আহমেদ',
        subtitle: '@tanvir_dev',
        description: 'নিলফা সোশ্যাল বাংলাদেশের নিজস্ব সুরক্ষিত সামাজিক যোগাযোগ মাধ্যম। #BangladeshTech',
        action_url: '/posts/post-101',
      },
      {
        id: 'post-102',
        type: 'post',
        title: 'নুসরাত জাহান',
        subtitle: '@nusrat_jahan',
        description: 'আজকের সিলেটের চা বাগানের মনোমুগ্ধকর সূর্যাস্ত। প্রাকৃতিক সৌন্দর্য অতুলনীয়! #TravelBangladesh',
        action_url: '/posts/post-102',
      },
    ];

    // Demo Groups
    const demoGroups: GlobalSearchResultItem[] = [
      {
        id: 'grp-tech',
        type: 'group',
        title: 'বাংলাদেশ টেক হাব',
        subtitle: '২,৪৫০ সদস্য',
        description: 'প্রযুক্তি, কোডিং এবং ফ্রিল্যান্সিং সম্পর্কিত উন্মুক্ত আলোচনা।',
        action_url: '/communities',
      },
      {
        id: 'grp-photo',
        type: 'group',
        title: 'ফটোগ্রাফার্স অব বাংলাদেশ',
        subtitle: '১,৮২০ সদস্য',
        description: 'বাংলাদেশের সুন্দর ছবি এবং আলোকচিত্রীদের কমিউনিটি।',
        action_url: '/communities',
      },
    ];

    // Demo Pages
    const demoPages: GlobalSearchResultItem[] = [
      {
        id: 'pg-news',
        type: 'page',
        title: 'টেক নিউজ বাংলা',
        subtitle: 'প্রযুক্তি ও গ্যাজেট • ৫,১২০ অনুসারী',
        description: 'বাংলা ভাষায় প্রযুক্তি জগতের সর্বশেষ নির্ভরযোগ্য সংবাদ।',
        action_url: '/communities',
      },
    ];

    // Demo Live Streams
    const demoLive: GlobalSearchResultItem[] = [
      {
        id: 'live-stream-1',
        type: 'live',
        title: 'লাইভ আড্ডা ও প্রশ্ন-উত্তর পর্ব',
        subtitle: 'লাইভ • ১২৪ জন দর্শক',
        description: 'সরাসরি দর্শক প্রশ্নোত্তর ও প্রযুক্তি আলোচনা।',
        action_url: '/live/live-stream-1',
      },
    ];

    if (shouldSearchUsers) {
      results.users = demoUsers.filter(
        (u) =>
          u.title.toLowerCase().includes(lowerQuery) ||
          u.subtitle?.toLowerCase().includes(lowerQuery) ||
          u.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (shouldSearchPosts) {
      results.posts = demoPosts.filter(
        (p) =>
          p.description?.toLowerCase().includes(lowerQuery) ||
          p.title.toLowerCase().includes(lowerQuery)
      );
    }

    if (shouldSearchGroups) {
      results.groups = demoGroups.filter(
        (g) =>
          g.title.toLowerCase().includes(lowerQuery) ||
          g.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (shouldSearchPages) {
      results.pages = demoPages.filter(
        (pg) =>
          pg.title.toLowerCase().includes(lowerQuery) ||
          pg.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (shouldSearchLive) {
      results.liveStreams = demoLive.filter(
        (l) =>
          l.title.toLowerCase().includes(lowerQuery) ||
          l.description?.toLowerCase().includes(lowerQuery)
      );
    }

    results.totalCount =
      results.users.length +
      results.posts.length +
      results.groups.length +
      results.pages.length +
      results.liveStreams.length;

    return results;
  },

  /**
   * Retrieves recent search history from local storage.
   */
  getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {}
    return [];
  },

  /**
   * Saves a recent search query locally (deduplicated).
   */
  addRecentSearch(query: string): void {
    const clean = query.trim();
    if (!clean) return;

    try {
      let list = this.getRecentSearches();
      list = list.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      list.unshift(clean);
      if (list.length > MAX_RECENT_SEARCHES) {
        list = list.slice(0, MAX_RECENT_SEARCHES);
      }
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(list));
    } catch (e) {}
  },

  /**
   * Removes a single query from recent searches.
   */
  removeRecentSearch(query: string): void {
    try {
      let list = this.getRecentSearches();
      list = list.filter((item) => item !== query);
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(list));
    } catch (e) {}
  },

  /**
   * Clears all stored search history for privacy.
   */
  clearAllRecentSearches(): void {
    try {
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify([]));
    } catch (e) {}
  },
};
