/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Conversation,
  ConversationMember,
  ChatMessage,
  MessageType,
  MessageReaction,
  MessageAttachment,
  SocialUser,
} from '../types';

const STORAGE_KEY_CONVERSATIONS = 'nilpha_social_conversations_v1';
const STORAGE_KEY_MESSAGES = 'nilpha_social_messages_v1';

// Seed demo conversations and messages for fallback/offline testing
const INITIAL_DEMO_USERS: Record<string, SocialUser> = {
  'user-tanvir': {
    id: 'user-tanvir',
    username: 'tanvir_dev',
    display_name: 'তানভীর আহমেদ',
    avatar_url: null,
    bio: 'Software engineer building web apps in Dhaka.',
    verification_status: 'verified',
  },
  'user-nusrat': {
    id: 'user-nusrat',
    username: 'nusrat_jahan',
    display_name: 'নুসরাত জাহান',
    avatar_url: null,
    bio: 'UI/UX Designer & Community Lead.',
    verification_status: 'none',
  },
  'user-shariful': {
    id: 'user-shariful',
    username: 'shariful_isl',
    display_name: 'শরীফুল ইসলাম',
    avatar_url: null,
    bio: 'Tech enthusiast and open source contributor.',
    verification_status: 'none',
  },
  'user-nilpha-team': {
    id: 'user-nilpha-team',
    username: 'nilpha_community',
    display_name: 'নিলফা টেক কমিউনিটি',
    avatar_url: null,
    bio: 'Official Community Group for Nilpha Social creators.',
    verification_status: 'verified',
  },
};

function getLocalConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading local conversations:', err);
  }

  // Initial seed conversations
  const initial: Conversation[] = [
    {
      id: 'conv-demo-1',
      type: 'direct',
      created_by: 'user-tanvir',
      last_message_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      unreadCount: 1,
      isOnline: true,
      members: [
        {
          id: 'mem-1-1',
          conversation_id: 'conv-demo-1',
          user_id: 'user-tanvir',
          role: 'admin',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          profile: INITIAL_DEMO_USERS['user-tanvir'],
        },
      ],
    },
    {
      id: 'conv-demo-2',
      type: 'direct',
      created_by: 'user-nusrat',
      last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      unreadCount: 0,
      isOnline: false,
      members: [
        {
          id: 'mem-2-1',
          conversation_id: 'conv-demo-2',
          user_id: 'user-nusrat',
          role: 'admin',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          profile: INITIAL_DEMO_USERS['user-nusrat'],
        },
      ],
    },
    {
      id: 'conv-demo-3',
      type: 'group',
      title: 'নিলফা ডেভস ও ক্রিয়েটর ক্লাব',
      avatar_url: null,
      created_by: 'user-tanvir',
      last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      unreadCount: 0,
      members: [
        {
          id: 'mem-3-1',
          conversation_id: 'conv-demo-3',
          user_id: 'user-tanvir',
          role: 'admin',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          profile: INITIAL_DEMO_USERS['user-tanvir'],
        },
        {
          id: 'mem-3-2',
          conversation_id: 'conv-demo-3',
          user_id: 'user-nusrat',
          role: 'member',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          profile: INITIAL_DEMO_USERS['user-nusrat'],
        },
        {
          id: 'mem-3-3',
          conversation_id: 'conv-demo-3',
          user_id: 'user-shariful',
          role: 'member',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          profile: INITIAL_DEMO_USERS['user-shariful'],
        },
      ],
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(initial));
  } catch (err) {
    // Ignore storage quota errors
  }
  return initial;
}

function getLocalMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading local messages:', err);
  }

  const initial: Record<string, ChatMessage[]> = {
    'conv-demo-1': [
      {
        id: 'msg-1-1',
        conversation_id: 'conv-demo-1',
        sender_id: 'user-tanvir',
        content: 'আসসালামু আলাইকুম! আগামীকালের মিটআপের সেশন প্ল্যান রেডি হয়েছে?',
        message_type: 'text',
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        sender: INITIAL_DEMO_USERS['user-tanvir'],
        deliveryStatus: 'read',
        reactions: [
          {
            id: 'react-1',
            message_id: 'msg-1-1',
            user_id: 'user-me',
            reaction: '👍',
          },
        ],
      },
      {
        id: 'msg-1-2',
        conversation_id: 'conv-demo-1',
        sender_id: 'user-tanvir',
        content: 'নিলফা সোশ্যালের পার্ট ৫ রিয়েল-টাইম কল ও মেসেজিং ফিচারটি টেস্ট করে দেখতে পারো।',
        message_type: 'text',
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        sender: INITIAL_DEMO_USERS['user-tanvir'],
        deliveryStatus: 'delivered',
      },
    ],
    'conv-demo-2': [
      {
        id: 'msg-2-1',
        conversation_id: 'conv-demo-2',
        sender_id: 'user-nusrat',
        content: 'নতুন ইউজার ইন্টারফেসের কালার প্যালেট অনেক চমৎকার লাগছে!',
        message_type: 'text',
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        sender: INITIAL_DEMO_USERS['user-nusrat'],
        deliveryStatus: 'read',
      },
    ],
    'conv-demo-3': [
      {
        id: 'msg-3-1',
        conversation_id: 'conv-demo-3',
        sender_id: 'user-tanvir',
        content: 'সবাইকে নিলফা সোশ্যাল ডেভেলপার গ্রুপে স্বাগতম!',
        message_type: 'text',
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        sender: INITIAL_DEMO_USERS['user-tanvir'],
        deliveryStatus: 'read',
      },
      {
        id: 'msg-3-2',
        conversation_id: 'conv-demo-3',
        sender_id: 'user-shariful',
        content: 'ধন্যবাদ ভাই, গ্রুপের মাধ্যমে দারুণ কিছু আইডিয়া শেয়ার হবে আশা করি।',
        message_type: 'text',
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        sender: INITIAL_DEMO_USERS['user-shariful'],
        deliveryStatus: 'read',
      },
    ],
  };

  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(initial));
  } catch (err) {
    // Ignore storage quota errors
  }
  return initial;
}

export const messagingService = {
  /**
   * Fetch all conversations for the given authenticated user.
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: memberRows, error: memberErr } = await supabase
          .from('conversation_members')
          .select('conversation_id, role, muted, notifications_enabled, last_read_at, joined_at')
          .eq('user_id', userId);

        if (memberErr) throw memberErr;

        if (!memberRows || memberRows.length === 0) {
          return [];
        }

        const convIds = memberRows.map((m) => m.conversation_id);

        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select(`
            id,
            type,
            title,
            avatar_url,
            created_by,
            last_message_at,
            created_at,
            updated_at
          `)
          .in('id', convIds)
          .order('last_message_at', { ascending: false });

        if (convErr) throw convErr;

        // Fetch members and profiles for these conversations
        const { data: allMembers, error: allMemErr } = await supabase
          .from('conversation_members')
          .select(`
            id,
            conversation_id,
            user_id,
            role,
            muted,
            notifications_enabled,
            last_read_at,
            joined_at,
            profile:profiles(id, username, display_name, avatar_url, bio, verification_status)
          `)
          .in('conversation_id', convIds);

        if (allMemErr) console.warn('Could not fetch member profiles:', allMemErr);

        // Fetch last message for each conversation
        const enriched: Conversation[] = [];
        for (const c of convData || []) {
          const membersForConv = (allMembers || []).filter(
            (m: any) => m.conversation_id === c.id
          ).map((m: any) => ({
            ...m,
            profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          }));

          const myMember = memberRows.find((m) => m.conversation_id === c.id);

          // Get latest message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              reply_to_id,
              is_edited,
              deleted_at,
              created_at
            `)
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          let unreadCount = 0;
          if (myMember?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', c.id)
              .gt('created_at', myMember.last_read_at)
              .neq('sender_id', userId);
            unreadCount = count || 0;
          }

          enriched.push({
            id: c.id,
            type: c.type,
            title: c.title,
            avatar_url: c.avatar_url,
            created_by: c.created_by,
            last_message_at: c.last_message_at,
            created_at: c.created_at,
            updated_at: c.updated_at,
            members: membersForConv,
            lastMessage: lastMsgData ? (lastMsgData as ChatMessage) : null,
            unreadCount,
          });
        }

        return enriched;
      } catch (err) {
        console.warn('Supabase getConversations error, falling back to local:', err);
      }
    }

    // Local / Offline fallback
    const local = getLocalConversations();
    const messages = getLocalMessages();
    return local.map((c) => {
      const convMessages = messages[c.id] || [];
      const last = convMessages[convMessages.length - 1] || null;
      return {
        ...c,
        lastMessage: last,
      };
    });
  },

  /**
   * Get a single conversation by ID.
   */
  async getConversationById(convId: string, userId: string): Promise<Conversation | null> {
    const all = await this.getConversations(userId);
    return all.find((c) => c.id === convId) || null;
  },

  /**
   * Create or retrieve a direct conversation between current user and target user.
   */
  async createDirectConversation(
    targetUserId: string,
    currentUserId: string,
    targetProfile?: SocialUser
  ): Promise<Conversation> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Find existing direct conversation with both members
        const { data: myConversations } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', currentUserId);

        const convIds = (myConversations || []).map((c) => c.conversation_id);

        if (convIds.length > 0) {
          const { data: shared } = await supabase
            .from('conversation_members')
            .select('conversation_id, conversation:conversations(type)')
            .eq('user_id', targetUserId)
            .in('conversation_id', convIds);

          const directMatch = (shared || []).find(
            (s: any) => s.conversation?.type === 'direct'
          );

          if (directMatch) {
            const found = await this.getConversationById(directMatch.conversation_id, currentUserId);
            if (found) return found;
          }
        }

        // Create new direct conversation
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert({
            type: 'direct',
            created_by: currentUserId,
          })
          .select()
          .single();

        if (createErr) throw createErr;

        // Add both members
        await supabase.from('conversation_members').insert([
          {
            conversation_id: newConv.id,
            user_id: currentUserId,
            role: 'member',
          },
          {
            conversation_id: newConv.id,
            user_id: targetUserId,
            role: 'member',
          },
        ]);

        const full = await this.getConversationById(newConv.id, currentUserId);
        if (full) return full;
      } catch (err) {
        console.warn('Supabase createDirectConversation error, falling back:', err);
      }
    }

    // Local / Offline fallback
    const local = getLocalConversations();
    const existing = local.find(
      (c) =>
        c.type === 'direct' &&
        c.members.some((m) => m.user_id === targetUserId)
    );
    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      type: 'direct',
      created_by: currentUserId,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      unreadCount: 0,
      members: [
        {
          id: `mem-${Date.now()}-1`,
          conversation_id: `conv-${Date.now()}`,
          user_id: currentUserId,
          role: 'member',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        {
          id: `mem-${Date.now()}-2`,
          conversation_id: `conv-${Date.now()}`,
          user_id: targetUserId,
          role: 'member',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          profile: targetProfile,
        },
      ],
    };

    local.unshift(newConv);
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(local));
    return newConv;
  },

  /**
   * Create a group conversation.
   */
  async createGroupConversation(
    title: string,
    memberUserIds: string[],
    currentUserId: string,
    avatarUrl?: string
  ): Promise<Conversation> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert({
            type: 'group',
            title,
            avatar_url: avatarUrl || null,
            created_by: currentUserId,
          })
          .select()
          .single();

        if (createErr) throw createErr;

        const membersToInsert = [
          {
            conversation_id: newConv.id,
            user_id: currentUserId,
            role: 'admin',
          },
          ...memberUserIds
            .filter((id) => id !== currentUserId)
            .map((id) => ({
              conversation_id: newConv.id,
              user_id: id,
              role: 'member',
            })),
        ];

        await supabase.from('conversation_members').insert(membersToInsert);

        const full = await this.getConversationById(newConv.id, currentUserId);
        if (full) return full;
      } catch (err) {
        console.warn('Supabase createGroupConversation error, falling back:', err);
      }
    }

    // Local fallback
    const local = getLocalConversations();
    const newConv: Conversation = {
      id: `conv-group-${Date.now()}`,
      type: 'group',
      title,
      avatar_url: avatarUrl || null,
      created_by: currentUserId,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      unreadCount: 0,
      members: [
        {
          id: `mem-${Date.now()}-admin`,
          conversation_id: `conv-group-${Date.now()}`,
          user_id: currentUserId,
          role: 'admin',
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        ...memberUserIds.map((uid) => ({
          id: `mem-${Date.now()}-${uid}`,
          conversation_id: `conv-group-${Date.now()}`,
          user_id: uid,
          role: 'member' as const,
          muted: false,
          notifications_enabled: true,
          last_read_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          profile: INITIAL_DEMO_USERS[uid],
        })),
      ],
    };

    local.unshift(newConv);
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(local));
    return newConv;
  },

  /**
   * Fetch messages for a conversation with pagination support.
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    beforeTimestamp?: string
  ): Promise<ChatMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            reply_to_id,
            is_edited,
            deleted_at,
            metadata,
            created_at,
            updated_at,
            sender:profiles(id, username, display_name, avatar_url, bio, verification_status),
            attachments:message_attachments(id, message_id, file_url, file_name, file_size, file_type),
            reactions:message_reactions(id, message_id, user_id, reaction)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (beforeTimestamp) {
          query = query.lt('created_at', beforeTimestamp);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Return chronological order (oldest to newest for chat view)
        const formatted = (data || []).map((msg: any) => ({
          ...msg,
          sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
          deliveryStatus: 'read' as const,
        }));

        return formatted.reverse();
      } catch (err) {
        console.warn('Supabase getMessages error, falling back:', err);
      }
    }

    // Local fallback
    const all = getLocalMessages();
    const convMsgs = all[conversationId] || [];
    return [...convMsgs];
  },

  /**
   * Send a message to a conversation.
   */
  async sendMessage(input: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
    replyToId?: string;
    attachments?: { file_url: string; file_name: string; file_size: number; file_type: string }[];
    clientTempId?: string;
    senderProfile?: SocialUser;
  }): Promise<ChatMessage> {
    const {
      conversationId,
      senderId,
      content,
      messageType = 'text',
      replyToId,
      attachments = [],
      clientTempId,
      senderProfile,
    } = input;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newMsg, error: msgErr } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            message_type: messageType,
            reply_to_id: replyToId || null,
          })
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            reply_to_id,
            is_edited,
            deleted_at,
            created_at,
            updated_at
          `)
          .single();

        if (msgErr) throw msgErr;

        // If attachments exist, insert them
        let insertedAttachments: MessageAttachment[] = [];
        if (attachments.length > 0) {
          const { data: attData } = await supabase
            .from('message_attachments')
            .insert(
              attachments.map((att) => ({
                message_id: newMsg.id,
                ...att,
              }))
            )
            .select();
          insertedAttachments = attData || [];
        }

        // Mark conversation read for sender
        await this.markConversationAsRead(conversationId, senderId);

        return {
          ...newMsg,
          sender: senderProfile,
          attachments: insertedAttachments,
          reactions: [],
          deliveryStatus: 'sent',
          clientTempId,
        };
      } catch (err) {
        console.warn('Supabase sendMessage error, saving locally:', err);
      }
    }

    // Local / Offline fallback
    const all = getLocalMessages();
    const convMsgs = all[conversationId] || [];

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      reply_to_id: replyToId || null,
      is_edited: false,
      created_at: new Date().toISOString(),
      sender: senderProfile || {
        id: senderId,
        username: 'me',
        display_name: 'You',
      },
      attachments: attachments.map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        message_id: `msg-${Date.now()}`,
        ...att,
      })),
      reactions: [],
      deliveryStatus: 'sent',
      clientTempId,
    };

    convMsgs.push(newMsg);
    all[conversationId] = convMsgs;
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(all));

    // Update conversation last_message_at
    const convs = getLocalConversations();
    const targetConv = convs.find((c) => c.id === conversationId);
    if (targetConv) {
      targetConv.last_message_at = newMsg.created_at;
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
    }

    return newMsg;
  },

  /**
   * Edit a user's own message.
   */
  async editMessage(messageId: string, conversationId: string, userId: string, newContent: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({
            content: newContent,
            is_edited: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', messageId)
          .eq('sender_id', userId);

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase editMessage error, fallback:', err);
      }
    }

    // Local fallback
    const all = getLocalMessages();
    const convMsgs = all[conversationId] || [];
    const target = convMsgs.find((m) => m.id === messageId);
    if (target && target.sender_id === userId) {
      target.content = newContent;
      target.is_edited = true;
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(all));
    }
  },

  /**
   * Delete / Soft-delete a user's own message.
   */
  async deleteMessage(messageId: string, conversationId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({
            deleted_at: new Date().toISOString(),
            content: 'এই বার্তাটি মুছে ফেলা হয়েছে (Message deleted)',
          })
          .eq('id', messageId)
          .eq('sender_id', userId);

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteMessage error, fallback:', err);
      }
    }

    // Local fallback
    const all = getLocalMessages();
    const convMsgs = all[conversationId] || [];
    const target = convMsgs.find((m) => m.id === messageId);
    if (target && target.sender_id === userId) {
      target.deleted_at = new Date().toISOString();
      target.content = 'এই বার্তাটি মুছে ফেলা হয়েছে (Message deleted)';
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(all));
    }
  },

  /**
   * Toggle reaction on a message.
   */
  async toggleReaction(
    messageId: string,
    conversationId: string,
    userId: string,
    emoji: string,
    userProfile?: SocialUser
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Check if existing reaction
        const { data: existing } = await supabase
          .from('message_reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('reaction', emoji)
          .maybeSingle();

        if (existing) {
          await supabase.from('message_reactions').delete().eq('id', existing.id);
        } else {
          await supabase.from('message_reactions').insert({
            message_id: messageId,
            user_id: userId,
            reaction: emoji,
          });
        }
        return;
      } catch (err) {
        console.warn('Supabase toggleReaction error, fallback:', err);
      }
    }

    // Local fallback
    const all = getLocalMessages();
    const convMsgs = all[conversationId] || [];
    const target = convMsgs.find((m) => m.id === messageId);
    if (target) {
      target.reactions = target.reactions || [];
      const index = target.reactions.findIndex(
        (r) => r.user_id === userId && r.reaction === emoji
      );
      if (index >= 0) {
        target.reactions.splice(index, 1);
      } else {
        target.reactions.push({
          id: `react-${Date.now()}`,
          message_id: messageId,
          user_id: userId,
          reaction: emoji,
          user: userProfile,
        });
      }
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(all));
    }
  },

  /**
   * Mark conversation as read for the user.
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        return;
      } catch (err) {
        console.warn('markConversationAsRead error:', err);
      }
    }

    // Local fallback
    const convs = getLocalConversations();
    const target = convs.find((c) => c.id === conversationId);
    if (target) {
      target.unreadCount = 0;
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
    }
  },

  /**
   * Toggle mute / notification preferences for a conversation.
   */
  async toggleMuteConversation(
    conversationId: string,
    userId: string,
    currentlyMuted: boolean
  ): Promise<boolean> {
    const newMuted = !currentlyMuted;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('conversation_members')
          .update({ muted: newMuted })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        return newMuted;
      } catch (err) {
        console.warn('toggleMuteConversation error:', err);
      }
    }

    // Local fallback
    const convs = getLocalConversations();
    const target = convs.find((c) => c.id === conversationId);
    if (target) {
      const mem = target.members.find((m) => m.user_id === userId);
      if (mem) mem.muted = newMuted;
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
    }
    return newMuted;
  },

  /**
   * Subscribe to real-time messages & reactions for a conversation.
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: (msg: ChatMessage) => void,
    onMessageUpdate: (msg: Partial<ChatMessage>) => void,
    onReaction: (reaction: MessageReaction) => void
  ) {
    if (!isSupabaseConfigured || !supabase) {
      return { unsubscribe: () => {} };
    }

    try {
      const channel = supabase
        .channel(`chat_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            onMessage(payload.new as ChatMessage);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            onMessageUpdate(payload.new as Partial<ChatMessage>);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reactions',
          },
          (payload) => {
            onReaction(payload.new as MessageReaction);
          }
        )
        .subscribe();

      return {
        unsubscribe: () => {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        },
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
      return { unsubscribe: () => {} };
    }
  },
};
