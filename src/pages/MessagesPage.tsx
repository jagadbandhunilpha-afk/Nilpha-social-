/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  CheckCheck,
  Check,
  Phone,
  Video,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { ChatArea } from '../components/messaging/ChatArea';
import { NewChatModal } from '../components/messaging/NewChatModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { messagingService } from '../services/messagingService';
import { Conversation, SocialUser } from '../types';

export const MessagesPage: React.FC = () => {
  const { t } = useLanguage();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const currentUserId = user?.id || 'user-me';
  const currentUserProfile: SocialUser = {
    id: currentUserId,
    username: profile?.username || 'me',
    display_name: profile?.display_name || 'You',
    avatar_url: profile?.avatar_url || null,
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(conversationId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const loadConversations = async () => {
    try {
      const data = await messagingService.getConversations(currentUserId);
      setConversations(data);
      if (!selectedConvId && data.length > 0 && window.innerWidth >= 1024) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (conversationId) {
      setSelectedConvId(conversationId);
    }
  }, [conversationId]);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const isGroup = c.type === 'group';
    const partner = c.members.find((m) => m.user_id !== currentUserId)?.profile;
    const name = isGroup ? c.title || '' : partner?.display_name || partner?.username || '';
    const lastMsg = c.lastMessage?.content || '';
    return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
  });

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || null;

  const handleSelectConversation = (convId: string) => {
    setSelectedConvId(convId);
    navigate(`/messages/${convId}`, { replace: true });
  };

  const formatListTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-6">
      {/* Page Header */}
      <PageHeader
        title={t('messagesTitle')}
        subtitle={t('messagesSubtitle')}
        kicker="রিয়েল-টাইম বার্তা ও কলিং"
        action={
          <button
            onClick={() => setShowNewChatModal(true)}
            className="min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newMessage')}</span>
          </button>
        }
      />

      {/* Main Messaging Layout Container */}
      <div className="bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden h-[76vh] min-h-[550px] flex">
        {/* Conversation List Sidebar */}
        <div
          className={`w-full lg:w-80 xl:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 ${
            selectedConvId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইনবক্স অনুসন্ধান করুন..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-[#155EEF] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#155EEF]" />
                <span>কথোপকথন লোড হচ্ছে...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  কোনো বার্তা পাওয়া যায়নি
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-3 text-xs text-[#155EEF] dark:text-blue-400 font-semibold hover:underline"
                >
                  + নতুন বার্তা শুরু করুন
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isGroup = conv.type === 'group';
                const partner = conv.members.find((m) => m.user_id !== currentUserId)?.profile;
                const name = isGroup ? conv.title || 'গ্রুপ চ্যাট' : partner?.display_name || 'Member';
                const isSelected = conv.id === selectedConvId;
                const unread = conv.unreadCount || 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-[#155EEF]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {isGroup ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {conv.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151D2C]" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {name}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {formatListTime(conv.lastMessage?.created_at || conv.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {conv.lastMessage?.content || 'কোনো বার্তা নেই'}
                        </p>
                        {unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#155EEF] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area Window */}
        {selectedConv ? (
          <div
            className={`flex-1 h-full flex flex-col ${
              !selectedConvId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <ChatArea
              conversation={selectedConv}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
              onBackMobile={() => {
                setSelectedConvId(null);
                navigate('/messages', { replace: true });
              }}
              onConversationUpdated={loadConversations}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/60 dark:bg-blue-900/30 text-[#155EEF] dark:text-blue-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              কথোপকথন নির্বাচন করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              বামদিকের তালিকা থেকে যেকোনো চ্যাট নির্বাচন করুন অথবা নতুন বন্ধুদের সাথে বার্তা বিনিময় শুরু করুন।
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors"
            >
              + নতুন বার্তা পাঠান
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          currentUserId={currentUserId}
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={(newConvId) => {
            loadConversations();
            setSelectedConvId(newConvId);
            navigate(`/messages/${newConvId}`, { replace: true });
          }}
        />
      )}
    </div>
  );
};
