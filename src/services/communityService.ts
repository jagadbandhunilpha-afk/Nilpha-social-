/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SocialGroup,
  GroupMemberItem,
  CreateGroupInput,
  GroupRole,
  SocialPage,
  PageMemberItem,
  CreatePageInput,
  PageRole,
} from '../types';

const STORAGE_PREFIX = 'nilpha_social_communities_';

// Initial default demo groups
const INITIAL_DEMO_GROUPS: SocialGroup[] = [
  {
    id: 'group-1',
    name: 'বাংলাদেশ টেক হাব ও স্টার্টআপ ফোরাম',
    slug: 'bd-tech-hub',
    description: 'বাংলাদেশের উদীয়মান সফটওয়্যার উদ্যোক্তা, সফটওয়্যার ইঞ্জিনিয়ার ও টেকপ্রেমীদের প্রধান আলোচনা স্থান।',
    privacy: 'public',
    created_by: 'demo-user-1',
    member_count: 2450,
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    currentUserMembership: {
      role: 'member',
      status: 'active',
    },
  },
  {
    id: 'group-2',
    name: 'ঢাকা ফুড অ্যান্ড কালচার ক্লাব',
    slug: 'dhaka-food-culture',
    description: 'পুরান ঢাকার ঐতিহ্যবাহী খাবার থেকে শুরু করে ঢাকার সেরা রেসিপি ও ফুড রিভিউ এর খোলামেলা আড্ডা।',
    privacy: 'public',
    created_by: 'demo-user-2',
    member_count: 5820,
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    currentUserMembership: null,
  },
  {
    id: 'group-3',
    name: 'ডিজিটাল বুক ক্লাব বাংলাদেশ',
    slug: 'digital-book-club',
    description: 'বইপ্রেমীদের নিয়মিত পাঠচক্র, সাহিত্য সমালোচনা এবং প্রিয় বইয়ের সুপারিশ শেয়ার করার প্রাইভেট সার্কেল।',
    privacy: 'private',
    created_by: 'current-user',
    member_count: 1210,
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    currentUserMembership: {
      role: 'admin',
      status: 'active',
    },
  },
];

// Initial default demo pages
const INITIAL_DEMO_PAGES: SocialPage[] = [
  {
    id: 'page-1',
    name: 'নিলফা অফিসিয়াল আপডেট পেজ',
    slug: 'nilpha-official',
    category: 'অফিসিয়াল',
    description: 'নিলফা সোশ্যাল প্ল্যাটফর্মের নতুন সংস্করণ, ফিচার আপডেট ও ভবিষ্যৎ রোডম্যাপ জানার আনুষ্ঠানিক পেইজ।',
    website: 'https://nilpha.social',
    created_by: 'current-user',
    follower_count: 10540,
    created_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    currentUserRole: 'admin',
    isFollowing: true,
  },
  {
    id: 'page-2',
    name: 'বিজ্ঞান ও মহাকাশ জিজ্ঞাসা',
    slug: 'science-and-space',
    category: 'বিজ্ঞান',
    description: 'জ্যোতির্বিজ্ঞান, কোয়ান্টাম ফিজিক্স এবং সাম্প্রতিক মহাকাশ অভিযানের সহজবোধ্য বৈজ্ঞানিক ব্যাখ্যা।',
    website: 'https://science.nilpha.social',
    created_by: 'demo-user-3',
    follower_count: 3180,
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    currentUserRole: null,
    isFollowing: false,
  },
  {
    id: 'page-3',
    name: 'বাংলাদেশ ভ্রমণ ও ট্রেকিং গাইড',
    slug: 'bd-travel-trekking',
    category: 'ভ্রমণ',
    description: 'বান্দরবানের মেঘের চূড়া থেকে সেন্টমার্টিন—কম খরচে নিরাপদ ভ্রমণের রুট ও স্থানীয় টিপস।',
    website: 'https://travel.nilpha.social',
    created_by: 'demo-user-4',
    follower_count: 6700,
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    currentUserRole: null,
    isFollowing: true,
  },
];

interface MockCommunityStore {
  groups: SocialGroup[];
  groupMembers: GroupMemberItem[];
  pages: SocialPage[];
  pageMembers: PageMemberItem[];
  pageFollows: { page_id: string; user_id: string }[];
}

function getMockStore(): MockCommunityStore {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}store`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  const initial: MockCommunityStore = {
    groups: INITIAL_DEMO_GROUPS,
    groupMembers: [
      {
        id: 'gm-1',
        group_id: 'group-1',
        user_id: 'current-user',
        role: 'member',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'gm-2',
        group_id: 'group-3',
        user_id: 'current-user',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'gm-3',
        group_id: 'group-3',
        user_id: 'demo-user-2',
        role: 'member',
        status: 'pending',
        created_at: new Date().toISOString(),
        profile: {
          id: 'demo-user-2',
          username: 'nusrat_jahan',
          display_name: 'নুসরাত জাহান',
        },
      },
    ],
    pages: INITIAL_DEMO_PAGES,
    pageMembers: [
      {
        id: 'pm-1',
        page_id: 'page-1',
        user_id: 'current-user',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    ],
    pageFollows: [
      { page_id: 'page-1', user_id: 'current-user' },
      { page_id: 'page-3', user_id: 'current-user' },
    ],
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}store`, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveMockStore(store: MockCommunityStore) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}store`, JSON.stringify(store));
  } catch {
    // ignore
  }
}

// ============================================================================
// COMMUNITY SERVICE
// ============================================================================

export const communityService = {
  // --------------------------------------------------------------------------
  // GROUPS
  // --------------------------------------------------------------------------

  async getGroups(filter: 'all' | 'my' | 'discover', userId?: string): Promise<SocialGroup[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';

      return store.groups
        .map((g) => {
          const membership = store.groupMembers.find(
            (m) => m.group_id === g.id && m.user_id === currentId
          );
          return {
            ...g,
            currentUserMembership: membership
              ? { role: membership.role, status: membership.status }
              : null,
          };
        })
        .filter((g) => {
          if (filter === 'my') {
            return g.currentUserMembership && g.currentUserMembership.status === 'active';
          }
          if (filter === 'discover') {
            return !g.currentUserMembership;
          }
          return true;
        });
    }

    try {
      let query = supabase.from('groups').select('*').order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      const groups = data || [];
      if (!userId) {
        return groups.map((g: any) => ({ ...g, currentUserMembership: null }));
      }

      // Fetch user's memberships
      const { data: memberData } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', userId);

      const membershipMap = new Map();
      (memberData || []).forEach((m: any) => {
        membershipMap.set(m.group_id, { role: m.role, status: m.status });
      });

      return groups
        .map((g: any) => ({
          ...g,
          currentUserMembership: membershipMap.get(g.id) || null,
        }))
        .filter((g: any) => {
          if (filter === 'my') {
            return g.currentUserMembership && g.currentUserMembership.status === 'active';
          }
          if (filter === 'discover') {
            return !g.currentUserMembership;
          }
          return true;
        });
    } catch (err) {
      console.error('Error fetching groups:', err);
      return [];
    }
  },

  async createGroup(input: CreateGroupInput, userId: string): Promise<SocialGroup> {
    const slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const newGroup: SocialGroup = {
        id: 'group-' + Date.now(),
        name: input.name,
        slug,
        description: input.description,
        privacy: input.privacy,
        avatar_url: input.avatar_url || null,
        cover_url: input.cover_url || null,
        created_by: userId || 'current-user',
        member_count: 1,
        created_at: new Date().toISOString(),
        currentUserMembership: {
          role: 'admin',
          status: 'active',
        },
      };

      store.groups.unshift(newGroup);
      store.groupMembers.push({
        id: 'gm-' + Date.now(),
        group_id: newGroup.id,
        user_id: userId || 'current-user',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      saveMockStore(store);
      return newGroup;
    }

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: input.name,
        slug,
        description: input.description,
        privacy: input.privacy,
        avatar_url: input.avatar_url,
        cover_url: input.cover_url,
        created_by: userId,
        member_count: 1,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      currentUserMembership: {
        role: 'admin',
        status: 'active',
      },
    };
  },

  async joinGroup(groupId: string, userId: string, isPrivate: boolean): Promise<{ status: 'active' | 'pending' }> {
    const desiredStatus = isPrivate ? 'pending' : 'active';

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      const existing = store.groupMembers.find(
        (m) => m.group_id === groupId && m.user_id === currentId
      );
      if (!existing) {
        store.groupMembers.push({
          id: 'gm-' + Date.now(),
          group_id: groupId,
          user_id: currentId,
          role: 'member',
          status: desiredStatus,
          created_at: new Date().toISOString(),
        });
        if (desiredStatus === 'active') {
          const group = store.groups.find((g) => g.id === groupId);
          if (group) group.member_count += 1;
        }
        saveMockStore(store);
      }
      return { status: desiredStatus };
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
      status: desiredStatus,
    });

    if (error && error.code !== '23505') throw error;
    return { status: desiredStatus };
  },

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      store.groupMembers = store.groupMembers.filter(
        (m) => !(m.group_id === groupId && m.user_id === currentId)
      );
      const group = store.groups.find((g) => g.id === groupId);
      if (group && group.member_count > 1) group.member_count -= 1;
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userId });

    if (error) throw error;
    return true;
  },

  async getGroupMembers(groupId: string): Promise<GroupMemberItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      return store.groupMembers.filter((m) => m.group_id === groupId);
    }

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          role,
          status,
          created_at,
          profile:profiles!group_members_user_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        created_at: m.created_at,
        profile: m.profile,
      }));
    } catch (err) {
      console.error('Error fetching group members:', err);
      return [];
    }
  },

  async updateMemberRole(groupId: string, userId: string, role: GroupRole): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const member = store.groupMembers.find(
        (m) => m.group_id === groupId && m.user_id === userId
      );
      if (member) {
        member.role = role;
        saveMockStore(store);
      }
      return true;
    }

    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .match({ group_id: groupId, user_id: userId });

    if (error) throw error;
    return true;
  },

  async handleJoinRequest(groupId: string, memberId: string, accept: boolean): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const member = store.groupMembers.find((m) => m.id === memberId);
      if (member) {
        if (accept) {
          member.status = 'active';
          const group = store.groups.find((g) => g.id === groupId);
          if (group) group.member_count += 1;
        } else {
          store.groupMembers = store.groupMembers.filter((m) => m.id !== memberId);
        }
        saveMockStore(store);
      }
      return true;
    }

    if (accept) {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'active' })
        .eq('id', memberId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);
      if (error) throw error;
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // PAGES
  // --------------------------------------------------------------------------

  async getPages(filter: 'all' | 'my' | 'discover', userId?: string): Promise<SocialPage[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';

      return store.pages
        .map((p) => {
          const member = store.pageMembers.find(
            (m) => m.page_id === p.id && m.user_id === currentId
          );
          const isFollowing = store.pageFollows.some(
            (f) => f.page_id === p.id && f.user_id === currentId
          );
          return {
            ...p,
            currentUserRole: member ? member.role : null,
            isFollowing,
          };
        })
        .filter((p) => {
          if (filter === 'my') {
            return p.currentUserRole !== null || p.isFollowing;
          }
          if (filter === 'discover') {
            return !p.isFollowing && !p.currentUserRole;
          }
          return true;
        });
    }

    try {
      const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const pages = data || [];
      if (!userId) {
        return pages.map((p: any) => ({ ...p, currentUserRole: null, isFollowing: false }));
      }

      // Fetch user's page roles and follows
      const [membersRes, followsRes] = await Promise.all([
        supabase.from('page_members').select('*').eq('user_id', userId),
        supabase.from('page_followers').select('*').eq('user_id', userId),
      ]);

      const roleMap = new Map();
      (membersRes.data || []).forEach((m: any) => roleMap.set(m.page_id, m.role));

      const followSet = new Set((followsRes.data || []).map((f: any) => f.page_id));

      return pages
        .map((p: any) => ({
          ...p,
          currentUserRole: roleMap.get(p.id) || null,
          isFollowing: followSet.has(p.id),
        }))
        .filter((p: any) => {
          if (filter === 'my') {
            return p.currentUserRole !== null || p.isFollowing;
          }
          if (filter === 'discover') {
            return !p.isFollowing && !p.currentUserRole;
          }
          return true;
        });
    } catch (err) {
      console.error('Error fetching pages:', err);
      return [];
    }
  },

  async createPage(input: CreatePageInput, userId: string): Promise<SocialPage> {
    const slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const newPage: SocialPage = {
        id: 'page-' + Date.now(),
        name: input.name,
        slug,
        category: input.category || 'General',
        description: input.description,
        website: input.website,
        avatar_url: input.avatar_url || null,
        cover_url: input.cover_url || null,
        created_by: userId || 'current-user',
        follower_count: 1,
        created_at: new Date().toISOString(),
        currentUserRole: 'admin',
        isFollowing: true,
      };

      store.pages.unshift(newPage);
      store.pageMembers.push({
        id: 'pm-' + Date.now(),
        page_id: newPage.id,
        user_id: userId || 'current-user',
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      store.pageFollows.push({
        page_id: newPage.id,
        user_id: userId || 'current-user',
      });
      saveMockStore(store);
      return newPage;
    }

    const { data, error } = await supabase
      .from('pages')
      .insert({
        name: input.name,
        slug,
        category: input.category || 'General',
        description: input.description,
        website: input.website,
        avatar_url: input.avatar_url,
        cover_url: input.cover_url,
        created_by: userId,
        follower_count: 1,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      currentUserRole: 'admin',
      isFollowing: true,
    };
  },

  async followPage(pageId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      if (!store.pageFollows.some((f) => f.page_id === pageId && f.user_id === currentId)) {
        store.pageFollows.push({ page_id: pageId, user_id: currentId });
        const page = store.pages.find((p) => p.id === pageId);
        if (page) page.follower_count += 1;
        saveMockStore(store);
      }
      return true;
    }

    const { error } = await supabase.from('page_followers').insert({
      page_id: pageId,
      user_id: userId,
    });

    if (error && error.code !== '23505') throw error;
    return true;
  },

  async unfollowPage(pageId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      store.pageFollows = store.pageFollows.filter(
        (f) => !(f.page_id === pageId && f.user_id === currentId)
      );
      const page = store.pages.find((p) => p.id === pageId);
      if (page && page.follower_count > 0) page.follower_count -= 1;
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('page_followers')
      .delete()
      .match({ page_id: pageId, user_id: userId });

    if (error) throw error;
    return true;
  },
};
