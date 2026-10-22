/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LiveStream,
  LiveStreamComment,
  LiveStreamVisibility,
  LiveStreamStatus,
  StreamModerationAction,
  SocialUser,
} from '../types';

const STORAGE_KEY_LIVE_STREAMS = 'nilpha_social_live_streams_v1';
const STORAGE_KEY_LIVE_COMMENTS = 'nilpha_social_live_comments_v1';

const INITIAL_DEMO_STREAMS: LiveStream[] = [
  {
    id: 'stream-demo-1',
    host_id: 'user-tanvir',
    title: 'নিলফা সোশ্যাল লাইভ কোডিং ও টেক আড্ডা 🚀',
    description: 'React, TypeScript, এবং রিয়েল-টাইম আর্কিটেকচার নিয়ে সরাসরি আলোচনা ও প্রশ্নোত্তর পর্ব।',
    visibility: 'public',
    status: 'live',
    viewer_count: 48,
    started_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    host: {
      id: 'user-tanvir',
      username: 'tanvir_dev',
      display_name: 'তানভীর আহমেদ',
      avatar_url: null,
      verification_status: 'verified',
    },
  },
  {
    id: 'stream-demo-2',
    host_id: 'user-nusrat',
    title: 'ইউআই/ইউএক্স ডিজাইন মাস্টারক্লাস: মোবাইল ফার্স্ট ফিড 🎨',
    description: 'আধুনিক সোশ্যাল মিডিয়ার ডিজাইন সিস্টেম ও কালার থিওরি নিয়ে লাইভ ওয়ার্কশপ।',
    visibility: 'public',
    status: 'live',
    viewer_count: 32,
    started_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    host: {
      id: 'user-nusrat',
      username: 'nusrat_jahan',
      display_name: 'নুসরাত জাহান',
      avatar_url: null,
      verification_status: 'none',
    },
  },
];

const INITIAL_DEMO_COMMENTS: Record<string, LiveStreamComment[]> = {
  'stream-demo-1': [
    {
      id: 'lcom-1',
      stream_id: 'stream-demo-1',
      user_id: 'user-shariful',
      content: 'মাশাআল্লাহ ভাই! লাইভ স্ট্রিমিং ও কলিং আর্কিটেকচার খুব দারুণ হয়েছে।',
      is_pinned: true,
      is_deleted: false,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      user: {
        id: 'user-shariful',
        username: 'shariful_isl',
        display_name: 'শরীফুল ইসলাম',
      },
    },
    {
      id: 'lcom-2',
      stream_id: 'stream-demo-1',
      user_id: 'user-nusrat',
      content: 'সাউন্ড এবং ভিডিও কোয়ালিটি অনেক পরিষ্কার আসছে 🔥',
      is_pinned: false,
      is_deleted: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      user: {
        id: 'user-nusrat',
        username: 'nusrat_jahan',
        display_name: 'নুসরাত জাহান',
      },
    },
  ],
};

function getLocalStreams(): LiveStream[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE_STREAMS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading local streams:', err);
  }
  try {
    localStorage.setItem(STORAGE_KEY_LIVE_STREAMS, JSON.stringify(INITIAL_DEMO_STREAMS));
  } catch (err) {}
  return INITIAL_DEMO_STREAMS;
}

function getLocalComments(): Record<string, LiveStreamComment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE_COMMENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading local stream comments:', err);
  }
  try {
    localStorage.setItem(STORAGE_KEY_LIVE_COMMENTS, JSON.stringify(INITIAL_DEMO_COMMENTS));
  } catch (err) {}
  return INITIAL_DEMO_COMMENTS;
}

export const liveStreamingService = {
  /**
   * Get all active or recent live streams.
   */
  async getLiveStreams(filterStatus: 'all' | 'live' | 'ended' = 'live'): Promise<LiveStream[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('live_streams')
          .select(`
            id,
            host_id,
            title,
            description,
            visibility,
            status,
            viewer_count,
            started_at,
            ended_at,
            created_at,
            host:profiles(id, username, display_name, avatar_url, verification_status)
          `)
          .order('started_at', { ascending: false });

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((s: any) => ({
          ...s,
          host: Array.isArray(s.host) ? s.host[0] : s.host,
        }));
      } catch (err) {
        console.warn('Supabase getLiveStreams error, falling back:', err);
      }
    }

    // Local fallback
    const local = getLocalStreams();
    if (filterStatus === 'all') return local;
    return local.filter((s) => s.status === filterStatus);
  },

  /**
   * Get a live stream by its unique ID.
   */
  async getLiveStreamById(streamId: string): Promise<LiveStream | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select(`
            id,
            host_id,
            title,
            description,
            visibility,
            status,
            viewer_count,
            started_at,
            ended_at,
            created_at,
            host:profiles(id, username, display_name, avatar_url, verification_status)
          `)
          .eq('id', streamId)
          .single();

        if (error) throw error;
        return {
          ...data,
          host: Array.isArray(data.host) ? data.host[0] : data.host,
        };
      } catch (err) {
        console.warn('Supabase getLiveStreamById error, falling back:', err);
      }
    }

    const local = getLocalStreams();
    return local.find((s) => s.id === streamId) || null;
  },

  /**
   * Create a new live stream broadcast.
   */
  async createLiveStream(input: {
    hostId: string;
    title: string;
    description?: string;
    visibility: LiveStreamVisibility;
    hostProfile?: SocialUser;
  }): Promise<LiveStream> {
    const { hostId, title, description, visibility, hostProfile } = input;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .insert({
            host_id: hostId,
            title,
            description: description || null,
            visibility,
            status: 'live',
            viewer_count: 1,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          host: hostProfile,
        };
      } catch (err) {
        console.warn('Supabase createLiveStream error, falling back:', err);
      }
    }

    // Local fallback
    const local = getLocalStreams();
    const newStream: LiveStream = {
      id: `stream-${Date.now()}`,
      host_id: hostId,
      title,
      description: description || null,
      visibility,
      status: 'live',
      viewer_count: 1,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      host: hostProfile,
    };

    local.unshift(newStream);
    localStorage.setItem(STORAGE_KEY_LIVE_STREAMS, JSON.stringify(local));
    return newStream;
  },

  /**
   * End a live stream broadcast.
   */
  async endLiveStream(streamId: string, hostId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('live_streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('id', streamId)
          .eq('host_id', hostId);

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase endLiveStream error, falling back:', err);
      }
    }

    // Local fallback
    const local = getLocalStreams();
    const target = local.find((s) => s.id === streamId);
    if (target) {
      target.status = 'ended';
      target.ended_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_LIVE_STREAMS, JSON.stringify(local));
    }
  },

  /**
   * Fetch comments for a live stream.
   */
  async getComments(streamId: string): Promise<LiveStreamComment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('live_stream_comments')
          .select(`
            id,
            stream_id,
            user_id,
            content,
            is_pinned,
            is_deleted,
            created_at,
            user:profiles(id, username, display_name, avatar_url)
          `)
          .eq('stream_id', streamId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        return (data || []).map((c: any) => ({
          ...c,
          user: Array.isArray(c.user) ? c.user[0] : c.user,
        }));
      } catch (err) {
        console.warn('Supabase getComments error, falling back:', err);
      }
    }

    const all = getLocalComments();
    return (all[streamId] || []).filter((c) => !c.is_deleted);
  },

  /**
   * Send a comment in a live stream.
   */
  async sendComment(
    streamId: string,
    userId: string,
    content: string,
    userProfile?: SocialUser
  ): Promise<LiveStreamComment> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('live_stream_comments')
          .insert({
            stream_id: streamId,
            user_id: userId,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          user: userProfile,
        };
      } catch (err) {
        console.warn('Supabase sendComment error, falling back:', err);
      }
    }

    // Local fallback
    const all = getLocalComments();
    const streamComments = all[streamId] || [];

    const newComment: LiveStreamComment = {
      id: `lcom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stream_id: streamId,
      user_id: userId,
      content,
      is_pinned: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      user: userProfile,
    };

    streamComments.push(newComment);
    all[streamId] = streamComments;
    localStorage.setItem(STORAGE_KEY_LIVE_COMMENTS, JSON.stringify(all));
    return newComment;
  },

  /**
   * Delete or moderate a comment.
   */
  async deleteComment(commentId: string, streamId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('live_stream_comments')
          .update({ is_deleted: true })
          .eq('id', commentId);
        return;
      } catch (err) {
        console.warn('deleteComment error:', err);
      }
    }

    // Local fallback
    const all = getLocalComments();
    const streamComments = all[streamId] || [];
    const target = streamComments.find((c) => c.id === commentId);
    if (target) {
      target.is_deleted = true;
      localStorage.setItem(STORAGE_KEY_LIVE_COMMENTS, JSON.stringify(all));
    }
  },

  /**
   * Pin or unpin a comment.
   */
  async togglePinComment(commentId: string, streamId: string, currentlyPinned: boolean): Promise<void> {
    const isPinned = !currentlyPinned;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('live_stream_comments')
          .update({ is_pinned: isPinned })
          .eq('id', commentId);
        return;
      } catch (err) {
        console.warn('togglePinComment error:', err);
      }
    }

    // Local fallback
    const all = getLocalComments();
    const streamComments = all[streamId] || [];
    const target = streamComments.find((c) => c.id === commentId);
    if (target) {
      target.is_pinned = isPinned;
      localStorage.setItem(STORAGE_KEY_LIVE_COMMENTS, JSON.stringify(all));
    }
  },

  /**
   * Moderate viewer (block or report).
   */
  async moderateViewer(
    streamId: string,
    moderatorId: string,
    targetUserId: string,
    actionType: 'block_viewer' | 'remove_comment' | 'report',
    reason?: string
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('live_stream_moderation_actions').insert({
          stream_id: streamId,
          moderator_id: moderatorId,
          target_user_id: targetUserId,
          action_type: actionType,
          reason: reason || null,
        });
      } catch (err) {
        console.warn('moderateViewer error:', err);
      }
    }
  },
};
