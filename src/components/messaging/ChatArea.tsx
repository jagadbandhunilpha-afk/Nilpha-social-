/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  X,
  Bell,
  BellOff,
  ArrowLeft,
  Loader2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Conversation, ChatMessage, SocialUser } from '../../types';
import { MessageBubble } from './MessageBubble';
import { messagingService } from '../../services/messagingService';
import { useCall } from '../../context/CallContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';

const QUICK_EMOJIS = ['😊', '👍', '❤️', '🎉', '🔥', '🙏'];

interface ChatAreaProps {
  conversation: Conversation;
  currentUserId: string;
  currentUserProfile?: SocialUser;
  onBackMobile?: () => void;
  onConversationUpdated?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUserId,
  currentUserProfile,
  onBackMobile,
  onConversationUpdated,
}) => {
  const { t } = useLanguage();
  const { showToast } = useNotice();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<
    { file_url: string; file_name: string; file_size: number; file_type: string }[]
  >([]);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Identify conversation partner
  const isGroup = conversation.type === 'group';
  const otherMember = conversation.members.find((m) => m.user_id !== currentUserId);
  const title = isGroup
    ? conversation.title || 'গ্রুপ চ্যাট'
    : otherMember?.profile?.display_name || 'Nilpha Member';
  const subtitle = isGroup
    ? `${conversation.members.length} জন সদস্য`
    : otherMember?.profile?.username
    ? `@${otherMember.profile.username}`
    : 'সক্রিয়';

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load message history
  useEffect(() => {
    let isMounted = true;
    async function loadMessages() {
      setLoading(true);
      try {
        const msgs = await messagingService.getMessages(conversation.id);
        if (isMounted) {
          setMessages(msgs);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err) {
        console.warn('Could not load messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMessages();
    messagingService.markConversationAsRead(conversation.id, currentUserId);

    // Subscribe to real-time incoming messages
    const sub = messagingService.subscribeToConversation(
      conversation.id,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      },
      (updated) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
        );
      },
      (reaction) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== reaction.message_id) return m;
            const reacts = m.reactions || [];
            return {
              ...m,
              reactions: [...reacts, reaction],
            };
          })
        );
      }
    );

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [conversation.id, currentUserId]);

  const handleStartAudioCall = () => {
    if (isGroup) {
      showToast('গ্রুপ অডিও কলিং প্রক্রিয়া শুরু হচ্ছে...');
    }
    const targetUser: SocialUser = otherMember?.profile || {
      id: otherMember?.user_id || 'user-target',
      username: 'member',
      display_name: title,
    };
    startCall(targetUser, 'audio', conversation.id);
  };

  const handleStartVideoCall = () => {
    if (isGroup) {
      showToast('গ্রুপ ভিডিও কলিং রুম প্রস্তুত হচ্ছে...');
    }
    const targetUser: SocialUser = otherMember?.profile || {
      id: otherMember?.user_id || 'user-target',
      username: 'member',
      display_name: title,
    };
    startCall(targetUser, 'video', conversation.id);
  };

  const handleToggleMute = async () => {
    const newMuted = await messagingService.toggleMuteConversation(
      conversation.id,
      currentUserId,
      isMuted
    );
    setIsMuted(newMuted);
    showToast(newMuted ? 'কথোপকথন মিউট করা হয়েছে' : 'বিজ্ঞপ্তি চালু করা হয়েছে');
    onConversationUpdated?.();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Create local preview blob URL
      const previewUrl = URL.createObjectURL(file);
      setPendingAttachments((prev) => [
        ...prev,
        {
          file_url: previewUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        },
      ]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();

    if (!text && pendingAttachments.length === 0) return;

    // Handle Edit Mode
    if (editingMessage) {
      await messagingService.editMessage(
        editingMessage.id,
        conversation.id,
        currentUserId,
        text
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id ? { ...m, content: text, is_edited: true } : m
        )
      );
      setEditingMessage(null);
      setInputText('');
      return;
    }

    setSending(true);
    try {
      const sentMsg = await messagingService.sendMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        content: text || (pendingAttachments.length > 0 ? 'সংযুক্তি পাঠানো হয়েছে' : ''),
        replyToId: replyingTo?.id,
        attachments: pendingAttachments,
        senderProfile: currentUserProfile,
      });

      setMessages((prev) => [...prev, sentMsg]);
      setInputText('');
      setPendingAttachments([]);
      setReplyingTo(null);
      setShowEmojiBar(false);
      setTimeout(() => scrollToBottom(), 50);
      onConversationUpdated?.();
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await messagingService.toggleReaction(
      messageId,
      conversation.id,
      currentUserId,
      emoji,
      currentUserProfile
    );
    // Refresh local reaction count
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        const index = reactions.findIndex(
          (r) => r.user_id === currentUserId && r.reaction === emoji
        );
        if (index >= 0) {
          reactions.splice(index, 1);
        } else {
          reactions.push({
            id: `react-${Date.now()}`,
            message_id: messageId,
            user_id: currentUserId,
            reaction: emoji,
            user: currentUserProfile,
          });
        }
        return { ...m, reactions };
      })
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    await messagingService.deleteMessage(messageId, conversation.id, currentUserId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              deleted_at: new Date().toISOString(),
              content: 'এই বার্তাটি মুছে ফেলা হয়েছে (Message deleted)',
            }
          : m
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#151D2C] relative overflow-hidden">
      {/* 1. Chat Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#151D2C]/80 backdrop-blur-xs z-10">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {title.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              {!isGroup && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
              <span>{subtitle}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio Call, Video Call, Mute */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Audio Call */}
          <button
            onClick={handleStartAudioCall}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#155EEF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            title="অডিও কল শুরু করুন"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={handleStartVideoCall}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#155EEF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            title="ভিডিও কল শুরু করুন"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Mute Conversation */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
          >
            {isMuted ? <BellOff className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-7 h-7 animate-spin mb-2 text-[#155EEF]" />
            <span>বার্তা লোড হচ্ছে...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#155EEF] flex items-center justify-center mb-3">
              <Smile className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              কথোপকথন শুরু করুন
            </h4>
            <p className="text-xs text-slate-500 max-w-xs">
              নিরাপদ এনক্রিপ্টেড বার্তা, অডিও-ভিডিও কল বা ফাইল শেয়ার করতে পারেন।
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentUserId}
                onReply={(m) => setReplyingTo(m)}
                onEdit={(m) => {
                  setEditingMessage(m);
                  setInputText(m.content);
                }}
                onDelete={handleDeleteMessage}
                onReaction={handleReaction}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 3. Reply / Edit Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs animate-fade-in">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-[#155EEF] dark:text-blue-400">
              {replyingTo.sender?.display_name || 'User'} কে উত্তর দিচ্ছেন:
            </span>
            <p className="truncate text-slate-600 dark:text-slate-300 text-[11px]">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs animate-fade-in">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-amber-600 dark:text-amber-400">
              বার্তা সম্পাদনা করছেন
            </span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Attachments Strip */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto bg-slate-50 dark:bg-slate-900/50">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0"
            >
              {att.file_type.startsWith('image/') ? (
                <img
                  src={att.file_url}
                  alt={att.file_name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <FileText className="w-5 h-5 text-slate-400" />
              )}
              <span className="truncate max-w-[100px] text-[11px] font-medium">
                {att.file_name}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="p-0.5 text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Emojis Row */}
      {showEmojiBar && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setInputText((prev) => prev + emoji)}
              className="text-xl hover:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 4. Bottom Input Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2C] shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* File attachment button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ছবি বা ফাইল সংযুক্ত করুন"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiBar(!showEmojiBar)}
            className="p-2.5 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ইমোজি"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="একটি বার্তা লিখুন..."
              rows={1}
              className="w-full px-4 py-2.5 max-h-32 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#155EEF] rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none transition-all leading-normal"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || (!inputText.trim() && pendingAttachments.length === 0)}
            className="p-2.5 rounded-2xl bg-[#155EEF] hover:bg-[#1048C6] text-white disabled:opacity-40 transition-all flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
            title="পাঠান"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
