/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppNotification, NotificationPreferences, NotificationType } from '../types';

const STORAGE_KEY_NOTIFS = 'nilpha_notifications_v1';
const STORAGE_KEY_PREFS = 'nilpha_notif_prefs_v1';

const DEFAULT_PREFS: NotificationPreferences = {
  user_id: '',
  friend_requests: true,
  likes_comments: true,
  mentions_tags: true,
  messages: true,
  groups_pages: true,
  calls_live: true,
  rewards_challenges: true,
  security_alerts: true,
};

function getLocalNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) return JSON.parse(raw);
  } catch (err) {}
  return [];
}

function saveLocalNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs.slice(0, 200)));
  } catch (err) {}
}

export const notificationService = {
  /**
   * Retrieves paginated notifications for the specified user, optionally filtered by category.
   */
  async getNotifications(
    userId: string,
    filter: 'all' | 'unread' | 'friends' | 'interactions' | 'groups' | 'system' = 'all',
    limit = 30
  ): Promise<AppNotification[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('notifications')
          .select(`
            *,
            actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)
          `)
          .eq('recipient_id', userId)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (filter === 'unread') {
          query = query.is('read_at', null);
        } else if (filter === 'friends') {
          query = query.in('notification_type', ['friend_request', 'friend_accepted', 'follow']);
        } else if (filter === 'interactions') {
          query = query.in('notification_type', ['post_like', 'post_comment', 'comment_reply', 'mention']);
        } else if (filter === 'groups') {
          query = query.in('notification_type', ['group_invite', 'group_decision', 'page_invite']);
        } else if (filter === 'system') {
          query = query.in('notification_type', ['challenge_completed', 'reward_eligible', 'referral_milestone', 'security_alert', 'missed_call']);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            recipient_id: d.recipient_id,
            actor_id: d.actor_id,
            actor_name: d.actor?.display_name || d.actor_name,
            actor_username: d.actor?.username || d.actor_username,
            actor_avatar: d.actor?.avatar_url || d.actor_avatar,
            notification_type: d.notification_type,
            title: d.title,
            body: d.body,
            entity_type: d.entity_type,
            entity_id: d.entity_id,
            action_url: d.action_url,
            read_at: d.read_at,
            is_read: !!d.read_at,
            is_dismissed: d.is_dismissed,
            event_id: d.event_id,
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getNotifications error, using fallback:', err);
      }
    }

    // Local in-memory / localStorage fallback
    const all = getLocalNotifications().filter((n) => n.recipient_id === userId && !n.is_dismissed);
    
    // Seed initial demo notifications if empty for realistic user experience
    if (all.length === 0) {
      const initialSeed: AppNotification[] = [
        {
          id: `notif-seed-1-${userId}`,
          recipient_id: userId,
          actor_id: 'user-tanvir',
          actor_name: 'তানভীর আহমেদ',
          actor_username: 'tanvir_dev',
          actor_avatar: null,
          notification_type: 'friend_request',
          title: 'আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছেন',
          body: 'তানভীর আহমেদ আপনার সাথে বন্ধুত্ব স্থাপন করতে চান।',
          entity_type: 'profile',
          entity_id: 'user-tanvir',
          action_url: '/friends',
          read_at: null,
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          event_id: `seed_friend_${userId}_tanvir`,
        },
        {
          id: `notif-seed-2-${userId}`,
          recipient_id: userId,
          actor_id: 'user-nusrat',
          actor_name: 'নুসরাত জাহান',
          actor_username: 'nusrat_jahan',
          actor_avatar: null,
          notification_type: 'post_like',
          title: 'আপনার পোস্টে পছন্দ করেছেন',
          body: 'নুসরাত আপনার সাম্প্রতিক পোস্টে লাইক দিয়েছেন।',
          entity_type: 'post',
          entity_id: 'demo-post-1',
          action_url: '/posts/demo-post-1',
          read_at: null,
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          event_id: `seed_like_${userId}_post1`,
        },
        {
          id: `notif-seed-3-${userId}`,
          recipient_id: userId,
          actor_id: null,
          actor_name: 'নিলফা রিওয়ার্ডস',
          actor_username: 'nilpha_rewards',
          actor_avatar: null,
          notification_type: 'reward_eligible',
          title: 'দৈনিক চেক-ইন বোনাস প্রস্তুত!',
          body: 'আজকের ফ্রি ডেমো কয়েন সংগ্রহ করতে রিওয়ার্ড সেন্টারে আসুন।',
          entity_type: 'reward',
          entity_id: 'daily_streak',
          action_url: '/rewards',
          read_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          event_id: `seed_reward_${userId}`,
        },
        {
          id: `notif-seed-4-${userId}`,
          recipient_id: userId,
          actor_id: 'group-tech-bd',
          actor_name: 'বাংলাদেশ টেক হাব',
          actor_username: 'group_tech_bd',
          actor_avatar: null,
          notification_type: 'group_invite',
          title: 'গ্রুপে যোগদানের আমন্ত্রণ',
          body: 'আপনাকে "বাংলাদেশ টেক হাব" গ্রুপে যোগদানের আমন্ত্রণ জানানো হয়েছে।',
          entity_type: 'group',
          entity_id: 'group-tech-bd',
          action_url: '/communities',
          read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          event_id: `seed_group_${userId}`,
        },
      ];
      saveLocalNotifications(initialSeed);
      return initialSeed;
    }

    let filtered = all;
    if (filter === 'unread') {
      filtered = all.filter((n) => !n.is_read);
    } else if (filter === 'friends') {
      filtered = all.filter((n) => ['friend_request', 'friend_accepted', 'follow'].includes(n.notification_type));
    } else if (filter === 'interactions') {
      filtered = all.filter((n) => ['post_like', 'post_comment', 'comment_reply', 'mention'].includes(n.notification_type));
    } else if (filter === 'groups') {
      filtered = all.filter((n) => ['group_invite', 'group_decision', 'page_invite'].includes(n.notification_type));
    } else if (filter === 'system') {
      filtered = all.filter((n) => ['challenge_completed', 'reward_eligible', 'referral_milestone', 'security_alert', 'missed_call'].includes(n.notification_type));
    }

    return filtered.slice(0, limit);
  },

  /**
   * Returns count of unread notifications for recipient.
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_dismissed', false)
          .is('read_at', null);

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch (err) {
        console.warn('Supabase getUnreadCount error:', err);
      }
    }

    const notifs = getLocalNotifications().filter((n) => n.recipient_id === userId && !n.is_dismissed && !n.is_read);
    return notifs.length;
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: now })
          .eq('id', notificationId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase markAsRead error:', err);
      }
    }

    const notifs = getLocalNotifications();
    const target = notifs.find((n) => n.id === notificationId);
    if (target) {
      target.read_at = now;
      target.is_read = true;
      saveLocalNotifications(notifs);
      return true;
    }
    return false;
  },

  /**
   * Marks all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: now })
          .eq('recipient_id', userId)
          .is('read_at', null);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase markAllAsRead error:', err);
      }
    }

    const notifs = getLocalNotifications();
    let updated = false;
    notifs.forEach((n) => {
      if (n.recipient_id === userId && !n.is_read) {
        n.read_at = now;
        n.is_read = true;
        updated = true;
      }
    });

    if (updated) {
      saveLocalNotifications(notifs);
    }
    return true;
  },

  /**
   * Dismisses or deletes a notification.
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_dismissed: true })
          .eq('id', notificationId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase dismissNotification error:', err);
      }
    }

    const notifs = getLocalNotifications();
    const idx = notifs.findIndex((n) => n.id === notificationId);
    if (idx >= 0) {
      notifs[idx].is_dismissed = true;
      saveLocalNotifications(notifs);
      return true;
    }
    return false;
  },

  /**
   * Creates a notification with deduplication (event_id/idempotency key).
   */
  async createNotification(params: {
    recipient_id: string;
    actor_id?: string | null;
    actor_name?: string;
    actor_username?: string;
    actor_avatar?: string | null;
    notification_type: NotificationType;
    title: string;
    body?: string | null;
    entity_type?: 'post' | 'profile' | 'group' | 'page' | 'conversation' | 'live_stream' | 'reward';
    entity_id?: string | null;
    action_url?: string | null;
    event_id?: string;
  }): Promise<{ success: boolean; notification?: AppNotification; isDuplicate?: boolean }> {
    const {
      recipient_id,
      actor_id,
      actor_name,
      actor_username,
      actor_avatar,
      notification_type,
      title,
      body,
      entity_type,
      entity_id,
      action_url,
      event_id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    } = params;

    // Do not notify self for own actions
    if (actor_id && actor_id === recipient_id) {
      return { success: false };
    }

    // Check user notification preferences
    const prefs = await this.getPreferences(recipient_id);
    if (!this.isCategoryEnabled(notification_type, prefs)) {
      return { success: false };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            recipient_id,
            actor_id: actor_id || null,
            notification_type,
            title,
            body: body || null,
            entity_type: entity_type || null,
            entity_id: entity_id || null,
            action_url: action_url || null,
            event_id,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            success: true,
            notification: {
              ...data,
              is_read: !!data.read_at,
              actor_name,
              actor_username,
              actor_avatar,
            },
          };
        } else if (error && error.code === '23505') {
          // Unique constraint violation on event_id = deduplicated
          return { success: true, isDuplicate: true };
        }
      } catch (err) {
        console.warn('Supabase createNotification error, falling back:', err);
      }
    }

    // Local / Offline Deduplication check
    const notifs = getLocalNotifications();
    const existing = notifs.find((n) => n.event_id === event_id);
    if (existing) {
      return { success: true, notification: existing, isDuplicate: true };
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipient_id,
      actor_id: actor_id || null,
      actor_name,
      actor_username,
      actor_avatar,
      notification_type,
      title,
      body,
      entity_type,
      entity_id,
      action_url,
      read_at: null,
      is_read: false,
      is_dismissed: false,
      event_id,
      created_at: new Date().toISOString(),
    };

    notifs.unshift(newNotif);
    saveLocalNotifications(notifs);

    return { success: true, notification: newNotif };
  },

  /**
   * Helper to check if a notification type is allowed by user preferences.
   */
  isCategoryEnabled(type: NotificationType, prefs: NotificationPreferences): boolean {
    if (['friend_request', 'friend_accepted', 'follow'].includes(type)) return prefs.friend_requests;
    if (['post_like', 'post_comment', 'comment_reply'].includes(type)) return prefs.likes_comments;
    if (type === 'mention') return prefs.mentions_tags;
    if (type === 'message') return prefs.messages;
    if (['group_invite', 'group_decision', 'page_invite'].includes(type)) return prefs.groups_pages;
    if (['calls_live', 'missed_call', 'live_stream'].includes(type)) return prefs.calls_live;
    if (['challenge_completed', 'reward_eligible', 'referral_milestone'].includes(type)) return prefs.rewards_challenges;
    if (type === 'security_alert') return prefs.security_alerts;
    return true;
  },

  /**
   * Retrieves notification preferences for a user.
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return data as NotificationPreferences;
        }
      } catch (err) {}
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFS}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (err) {}

    return { ...DEFAULT_PREFS, user_id: userId };
  },

  /**
   * Updates notification preferences for a user.
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('notification_preferences')
          .upsert(updated);
      } catch (err) {
        console.warn('Supabase updatePreferences error:', err);
      }
    }

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFS}_${userId}`, JSON.stringify(updated));
    } catch (err) {}

    return updated;
  },

  /**
   * Realtime subscription for incoming notifications.
   */
  subscribeToNotifications(userId: string, callback: (notif: AppNotification) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            callback({
              ...payload.new,
              is_read: !!payload.new.read_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};
