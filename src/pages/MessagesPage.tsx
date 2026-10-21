import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  User,
  Info,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { EmptyState } from '../components/common/EmptyState';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';
import { ConversationItem } from '../types';

const DEMO_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-1',
    name: 'ফারহান আহমেদ',
    lastMessage: 'আগামীকালের টেক মিটআপের সেশন প্ল্যান রেডি?',
    time: '১০:৪৫ AM',
    unreadCount: 1,
    avatarColor: 'bg-blue-600',
    initials: 'ফা',
  },
  {
    id: 'conv-2',
    name: 'নুসরাত জাহান',
    lastMessage: 'নিলফা সোশ্যালের নতুন কমিউনিটি গ্রুপে যুক্ত হয়েছি।',
    time: 'গতকাল',
    unreadCount: 0,
    avatarColor: 'bg-emerald-600',
    initials: 'নু',
  },
  {
    id: 'conv-3',
    name: 'শরীফুল ইসলাম',
    lastMessage: 'ধন্যবাদ ভাই, কোড রিভিউ করার জন্য!',
    time: '১৯ অক্টো',
    unreadCount: 0,
    avatarColor: 'bg-purple-600',
    initials: 'শ',
  },
];

export const MessagesPage: React.FC = () => {
  const { t } = useLanguage();
  const { openNotice, showToast } = useNotice();
  const [conversations] = useState<ConversationItem[]>(DEMO_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [localSentMessages, setLocalSentMessages] = useState<string[]>([]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const handleNewMessage = () => {
    openNotice(
      t('newMessage'),
      t('backendNotice'),
      'ব্যবহারকারী ডিরেক্টরি এবং রিয়েল-টাইম সকেট সংযোগ পরবর্তী ডেভেলপমেন্ট ধাপে প্রস্তুত করা হবে।'
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim()) return;
    setLocalSentMessages((prev) => [...prev, draftMessage.trim()]);
    setDraftMessage('');
    showToast('বার্তা পাঠানো হয়েছে (লোকাল প্রিভিউ ডেমো)');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t('messagesTitle')}
        subtitle={t('messagesSubtitle')}
        kicker="যোগাযোগ কেন্দ্র"
        action={
          <button
            onClick={handleNewMessage}
            className="min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newMessage')}</span>
          </button>
        }
      />

      <DemoNotice
        className="mb-5"
        message="পার্ট ১ মেসেজিং শেল — বার্তা প্রেরক ও গ্রাহক সম্পূর্ণ ডেমো ইন্টারফেস হিসেবে উপস্থাপিত।"
      />

      <div className="rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        {/* Conversation List Sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Search box */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchMessages')}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${conv.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {conv.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {conv.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#155EEF] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message View / Conversation Area */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/40 dark:bg-slate-900/20">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-3.5 px-4 bg-white dark:bg-[#151D2C] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${selectedConv.avatarColor} text-white font-bold text-xs flex items-center justify-center`}
                  >
                    {selectedConv.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedConv.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      ডেমো কথোপকথন প্রিভিউ
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 md:hidden"
                >
                  তালিকায় ফিরুন
                </button>
              </div>

              {/* Messages Body */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <div className="text-center my-2">
                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    আজকের ডেমো কথোপকথন
                  </span>
                </div>

                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="p-3 rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs">
                    {selectedConv.lastMessage}
                  </div>
                </div>

                {localSentMessages.map((msg, i) => (
                  <div key={i} className="flex justify-end">
                    <div className="p-3 rounded-2xl rounded-tr-xs bg-[#155EEF] text-white text-xs sm:text-sm shadow-2xs max-w-[80%]">
                      <p>{msg}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-200">
                        <span>এইমাত্র</span>
                        <CheckCheck className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-[#151D2C] border-t border-slate-200 dark:border-slate-800 flex gap-2"
              >
                <input
                  type="text"
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder={t('typeMessagePlaceholder')}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
                />
                <button
                  type="submit"
                  disabled={!draftMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('send')}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                title={t('emptyMessageTitle')}
                description={t('emptyMessageDesc')}
                icon={<MessageSquare className="w-8 h-8" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
