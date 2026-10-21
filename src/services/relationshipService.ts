/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  RelationshipCounts,
  UserRelationshipState,
  SocialUser,
  FriendRequestItem,
} from '../types';

// ============================================================================
// MOCK REPOSITORY FOR OFFLINE / DEMO TESTING
// ============================================================================
const STORAGE_PREFIX = 'nilpha_social_p4_';

const DEMO_USERS: SocialUser[] = [
  {
    id: 'demo-user-1',
    username: 'tanvir_ahmed',
    display_name: 'তানভীর আহমেদ',
    bio: 'সফটওয়্যার স্থপতি ও ওপেন সোর্স কন্ট্রিবিউটর। নিলফা কোডিং টিমে কাজ করছি।',
    avatar_url: null,
    verification_status: 'verified',
  },
  {
    id: 'demo-user-2',
    username: 'nusrat_jahan',
    display_name: 'নুসরাত জাহান',
    bio: 'ডিজিটাল প্রোডাক্ট ডিজাইনার ও টেক লেখক। মিনিমালিস্ট ও অ্যাক্সেসিবল ইন্টারফেস প্রেমী।',
    avatar_url: null,
    verification_status: 'verified',
  },
  {
    id: 'demo-user-3',
    username: 'kazi_shafin',
    display_name: 'কাজী শাফিন',
    bio: 'ফটোগ্রাফার ও ভ্রমণপ্রেমী। বাংলার নদী ও প্রকৃতির দৃশ্য ফ্রেমবন্দি করি।',
    avatar_url: null,
    verification_status: 'none',
  },
  {
    id: 'demo-user-4',
    username: 'sadia_akter',
    display_name: 'সাদিয়া আক্তার',
    bio: 'সাইবার নিরাপত্তা গবেষক ও পাইথন ডেভেলপার।',
    avatar_url: null,
    verification_status: 'none',
  },
  {
    id: 'demo-user-5',
    username: 'rahim_chowdhury',
    display_name: 'রহিম চৌধুরী',
    bio: 'প্রযুক্তি উদ্যোক্তা এবং স্টার্টআপ মেন্টর।',
    avatar_url: null,
    verification_status: 'verified',
  },
];

interface MockRelationshipStore {
  follows: { follower_id: string; following_id: string }[];
  friendRequests: FriendRequestItem[];
  friendships: { user_a_id: string; user_b_id: string }[];
  blocks: { blocker_id: string; blocked_id: string }[];
}

function getMockStore(): MockRelationshipStore {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}store`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Initial demo state
  const initial: MockRelationshipStore = {
    follows: [
      { follower_id: 'current-user', following_id: 'demo-user-1' },
      { follower_id: 'demo-user-2', following_id: 'current-user' },
      { follower_id: 'demo-user-3', following_id: 'current-user' },
    ],
    friendRequests: [
      {
        id: 'req-demo-1',
        sender_id: 'demo-user-4',
        receiver_id: 'current-user',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        sender: DEMO_USERS[3],
      },
      {
        id: 'req-demo-2',
        sender_id: 'current-user',
        receiver_id: 'demo-user-5',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        receiver: DEMO_USERS[4],
      },
    ],
    friendships: [
      { user_a_id: 'current-user', user_b_id: 'demo-user-1' },
    ],
    blocks: [],
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}store`, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveMockStore(store: MockRelationshipStore) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}store`, JSON.stringify(store));
  } catch {
    // ignore
  }
}

// ============================================================================
// RELATIONSHIP SERVICE IMPLEMENTATION
// ============================================================================

export const relationshipService = {
  /**
   * Get relationship counts (followers, following, friends)
   */
  async getCounts(userId: string): Promise<RelationshipCounts> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';

      const followersCount = store.follows.filter((f) => f.following_id === currentId).length;
      const followingCount = store.follows.filter((f) => f.follower_id === currentId).length;
      const friendsCount = store.friendships.filter(
        (fr) => fr.user_a_id === currentId || fr.user_b_id === currentId
      ).length;

      return { followersCount, followingCount, friendsCount };
    }

    try {
      const [followersRes, followingRes, friendsRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('friendships').select('*', { count: 'exact', head: true }).or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
      ]);

      return {
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0,
        friendsCount: friendsRes.count || 0,
      };
    } catch (err) {
      console.error('Error fetching relationship counts:', err);
      return { followersCount: 0, followingCount: 0, friendsCount: 0 };
    }
  },

  /**
   * Get relationship state between current user and target user
   */
  async getRelationshipState(currentUserId: string, targetUserId: string): Promise<UserRelationshipState> {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      return {
        isFollowing: false,
        isFollower: false,
        friendStatus: 'none',
        isBlocked: false,
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const isFollowing = store.follows.some(
        (f) => f.follower_id === currentUserId && f.following_id === targetUserId
      );
      const isFollower = store.follows.some(
        (f) => f.follower_id === targetUserId && f.following_id === currentUserId
      );
      const isFriends = store.friendships.some(
        (fr) =>
          (fr.user_a_id === currentUserId && fr.user_b_id === targetUserId) ||
          (fr.user_a_id === targetUserId && fr.user_b_id === currentUserId)
      );

      let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none';
      let requestId: string | undefined;

      if (isFriends) {
        friendStatus = 'friends';
      } else {
        const sentReq = store.friendRequests.find(
          (r) => r.sender_id === currentUserId && r.receiver_id === targetUserId && r.status === 'pending'
        );
        if (sentReq) {
          friendStatus = 'pending_sent';
          requestId = sentReq.id;
        } else {
          const receivedReq = store.friendRequests.find(
            (r) => r.sender_id === targetUserId && r.receiver_id === currentUserId && r.status === 'pending'
          );
          if (receivedReq) {
            friendStatus = 'pending_received';
            requestId = receivedReq.id;
          }
        }
      }

      const isBlocked = store.blocks.some(
        (b) => b.blocker_id === currentUserId && b.blocked_id === targetUserId
      );

      return {
        isFollowing,
        isFollower,
        friendStatus,
        requestId,
        isBlocked,
      };
    }

    try {
      const [followingRes, followerRes, friendRes, sentReqRes, recReqRes, blockRes] = await Promise.all([
        supabase.from('follows').select('*').match({ follower_id: currentUserId, following_id: targetUserId }).maybeSingle(),
        supabase.from('follows').select('*').match({ follower_id: targetUserId, following_id: currentUserId }).maybeSingle(),
        supabase
          .from('friendships')
          .select('*')
          .or(`and(user_a_id.eq.${currentUserId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${currentUserId})`)
          .maybeSingle(),
        supabase
          .from('friend_requests')
          .select('*')
          .match({ sender_id: currentUserId, receiver_id: targetUserId, status: 'pending' })
          .maybeSingle(),
        supabase
          .from('friend_requests')
          .select('*')
          .match({ sender_id: targetUserId, receiver_id: currentUserId, status: 'pending' })
          .maybeSingle(),
        supabase.from('user_blocks').select('*').match({ blocker_id: currentUserId, blocked_id: targetUserId }).maybeSingle(),
      ]);

      let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none';
      let reqId: string | undefined;

      if (friendRes.data) {
        friendStatus = 'friends';
      } else if (sentReqRes.data) {
        friendStatus = 'pending_sent';
        reqId = sentReqRes.data.id;
      } else if (recReqRes.data) {
        friendStatus = 'pending_received';
        reqId = recReqRes.data.id;
      }

      return {
        isFollowing: !!followingRes.data,
        isFollower: !!followerRes.data,
        friendStatus,
        requestId: reqId,
        isBlocked: !!blockRes.data,
      };
    } catch (err) {
      console.error('Error fetching relationship state:', err);
      return {
        isFollowing: false,
        isFollower: false,
        friendStatus: 'none',
        isBlocked: false,
      };
    }
  },

  /**
   * Follow a user
   */
  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) throw new Error('You cannot follow yourself');

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      if (!store.follows.some((f) => f.follower_id === followerId && f.following_id === followingId)) {
        store.follows.push({ follower_id: followerId, following_id: followingId });
        saveMockStore(store);
      }
      return true;
    }

    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error && error.code !== '23505') {
      // 23505 = duplicate key (already following)
      throw error;
    }
    return true;
  },

  /**
   * Unfollow a user
   */
  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      store.follows = store.follows.filter(
        (f) => !(f.follower_id === followerId && f.following_id === followingId)
      );
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;
    return true;
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
    if (senderId === receiverId) throw new Error('You cannot friend request yourself');

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const existing = store.friendRequests.find(
        (r) =>
          ((r.sender_id === senderId && r.receiver_id === receiverId) ||
            (r.sender_id === receiverId && r.receiver_id === senderId)) &&
          r.status === 'pending'
      );
      if (!existing) {
        const target = DEMO_USERS.find((u) => u.id === receiverId) || {
          id: receiverId,
          username: 'user_' + receiverId.slice(0, 6),
          display_name: 'ব্যবহারকারী',
        };
        store.friendRequests.push({
          id: 'req-' + Date.now(),
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending',
          created_at: new Date().toISOString(),
          receiver: target,
        });
        saveMockStore(store);
      }
      return true;
    }

    const { error } = await supabase.from('friend_requests').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });

    if (error && error.code !== '23505') throw error;
    return true;
  },

  /**
   * Cancel a pending friend request
   */
  async cancelFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      store.friendRequests = store.friendRequests.filter(
        (r) => !(r.sender_id === senderId && r.receiver_id === receiverId && r.status === 'pending')
      );
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: senderId, receiver_id: receiverId, status: 'pending' });

    if (error) throw error;
    return true;
  },

  /**
   * Accept an incoming friend request
   */
  async acceptFriendRequest(receiverId: string, senderId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      // Remove request
      store.friendRequests = store.friendRequests.filter(
        (r) => !(r.sender_id === senderId && r.receiver_id === receiverId)
      );
      // Canonical order
      const [uA, uB] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
      if (!store.friendships.some((f) => f.user_a_id === uA && f.user_b_id === uB)) {
        store.friendships.push({ user_a_id: uA, user_b_id: uB });
      }
      saveMockStore(store);
      return true;
    }

    // Insert friendship
    const [uA, uB] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
    const { error: insertErr } = await supabase.from('friendships').insert({
      user_a_id: uA,
      user_b_id: uB,
    });
    if (insertErr && insertErr.code !== '23505') throw insertErr;

    // Delete request
    await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: senderId, receiver_id: receiverId });

    return true;
  },

  /**
   * Reject an incoming friend request
   */
  async rejectFriendRequest(receiverId: string, senderId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      store.friendRequests = store.friendRequests.filter(
        (r) => !(r.sender_id === senderId && r.receiver_id === receiverId)
      );
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: senderId, receiver_id: receiverId });

    if (error) throw error;
    return true;
  },

  /**
   * Remove an existing friendship (unfriend)
   */
  async removeFriendship(userA: string, userB: string): Promise<boolean> {
    const [first, second] = userA < userB ? [userA, userB] : [userB, userA];

    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      store.friendships = store.friendships.filter(
        (f) => !(f.user_a_id === first && f.user_b_id === second)
      );
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase
      .from('friendships')
      .delete()
      .match({ user_a_id: first, user_b_id: second });

    if (error) throw error;
    return true;
  },

  /**
   * Get list of friends for a user
   */
  async getFriends(userId: string): Promise<SocialUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      const friendIds = store.friendships
        .map((f) => (f.user_a_id === currentId ? f.user_b_id : f.user_b_id === currentId ? f.user_a_id : null))
        .filter(Boolean) as string[];

      return DEMO_USERS.filter((u) => friendIds.includes(u.id)).map((u) => ({
        ...u,
        friendStatus: 'friends',
      }));
    }

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user_a_id,
          user_b_id,
          user_a:profiles!friendships_user_a_id_fkey(id, username, display_name, avatar_url, bio, verification_status),
          user_b:profiles!friendships_user_b_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (error) throw error;

      return (data || []).map((row: any) => {
        const isA = row.user_a_id === userId;
        const profile = isA ? row.user_b : row.user_a;
        return {
          id: profile?.id,
          username: profile?.username || 'user',
          display_name: profile?.display_name || 'User',
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
          verification_status: profile?.verification_status,
          friendStatus: 'friends',
        };
      });
    } catch (err) {
      console.error('Error fetching friends:', err);
      return [];
    }
  },

  /**
   * Get incoming friend requests
   */
  async getIncomingRequests(userId: string): Promise<FriendRequestItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      return store.friendRequests.filter((r) => r.receiver_id === currentId && r.status === 'pending');
    }

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          sender:profiles!friend_requests_sender_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        sender_id: item.sender_id,
        receiver_id: item.receiver_id,
        status: item.status,
        created_at: item.created_at,
        sender: item.sender,
      }));
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
      return [];
    }
  },

  /**
   * Get outgoing (sent) friend requests
   */
  async getOutgoingRequests(userId: string): Promise<FriendRequestItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      return store.friendRequests.filter((r) => r.sender_id === currentId && r.status === 'pending');
    }

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          receiver:profiles!friend_requests_receiver_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        sender_id: item.sender_id,
        receiver_id: item.receiver_id,
        status: item.status,
        created_at: item.created_at,
        receiver: item.receiver,
      }));
    } catch (err) {
      console.error('Error fetching outgoing requests:', err);
      return [];
    }
  },

  /**
   * Get followers of a user
   */
  async getFollowers(userId: string): Promise<SocialUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      const followerIds = store.follows.filter((f) => f.following_id === currentId).map((f) => f.follower_id);
      return DEMO_USERS.filter((u) => followerIds.includes(u.id));
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .eq('following_id', userId);

      if (error) throw error;

      return (data || []).map((row: any) => row.follower).filter(Boolean);
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  },

  /**
   * Get users whom the user is following
   */
  async getFollowing(userId: string): Promise<SocialUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      const currentId = userId || 'current-user';
      const followingIds = store.follows.filter((f) => f.follower_id === currentId).map((f) => f.following_id);
      return DEMO_USERS.filter((u) => followingIds.includes(u.id));
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, bio, verification_status)
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      return (data || []).map((row: any) => row.following).filter(Boolean);
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  },

  /**
   * Block / Unblock user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      if (!store.blocks.some((b) => b.blocker_id === blockerId && b.blocked_id === blockedId)) {
        store.blocks.push({ blocker_id: blockerId, blocked_id: blockedId });
        saveMockStore(store);
      }
      return true;
    }

    const { error } = await supabase.from('user_blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });
    if (error && error.code !== '23505') throw error;
    return true;
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const store = getMockStore();
      store.blocks = store.blocks.filter((b) => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
      saveMockStore(store);
      return true;
    }

    const { error } = await supabase.from('user_blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) throw error;
    return true;
  },

  /**
   * Discover / suggested users
   */
  async getSuggestedUsers(currentUserId?: string): Promise<SocialUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      const currentId = currentUserId || 'current-user';
      return DEMO_USERS.filter((u) => u.id !== currentId);
    }

    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, verification_status')
        .limit(10);

      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching suggested users:', err);
      return [];
    }
  },
};
