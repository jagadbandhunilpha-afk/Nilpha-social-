/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SocialUser } from '../../types';
import { relationshipService } from '../../services/relationshipService';
import { messagingService } from '../../services/messagingService';

interface NewChatModalProps {
  currentUserId: string;
  onClose: () => void;
  onConversationCreated: (convId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUserId,
  onClose,
  onConversationCreated,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<SocialUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      try {
        const [friends, followings] = await Promise.all([
          relationshipService.getFriends(currentUserId),
          relationshipService.getFollowing(currentUserId),
        ]);

        const combined = [...friends];
        for (const f of followings) {
          if (!combined.some((c) => c.id === f.id) && f.id !== currentUserId) {
            combined.push(f);
          }
        }
        setAvailableUsers(combined);
      } catch (err) {
        console.warn('Could not load contacts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [currentUserId]);

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  });

  const handleSelectDirectUser = async (targetUser: SocialUser) => {
    setSubmitting(true);
    try {
      const conv = await messagingService.createDirectConversation(
        targetUser.id,
        currentUserId,
        targetUser
      );
      onConversationCreated(conv.id);
      onClose();
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim() || selectedUserIds.length === 0) return;

    setSubmitting(true);
    try {
      const conv = await messagingService.createGroupConversation(
        groupTitle.trim(),
        selectedUserIds,
        currentUserId
      );
      onConversationCreated(conv.id);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#151D2C] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#155EEF]" />
            <span>নতুন কথোপকথন শুরু করুন</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-slate-800 text-[#155EEF] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ১-অন-১ সরাসরি বার্তা
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'group'
                ? 'bg-white dark:bg-slate-800 text-[#155EEF] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            গ্রুপ চ্যাট তৈরি করুন
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'group' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                গ্রুপের নাম *
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="যেমন: ঢাকা ফ্রেন্ডস সার্কেল"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
              />
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বন্ধু বা অনুসারীদের নাম অনুসন্ধান করুন..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
            />
          </div>

          {/* Users List */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {activeTab === 'direct' ? 'সরাসরি চ্যাট করতে নির্বাচন করুন' : `সদস্য নির্বাচন করুন (${selectedUserIds.length})`}
            </div>

            {loading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                কোনো পরিচিত ব্যবহারকারী পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() =>
                        activeTab === 'direct'
                          ? handleSelectDirectUser(u)
                          : handleToggleSelectUser(u.id)
                      }
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {u.display_name ? u.display_name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {u.display_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      {activeTab === 'group' && (
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#155EEF] border-[#155EEF] text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer for Group */}
        {activeTab === 'group' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              বাতিল
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={submitting || !groupTitle.trim() || selectedUserIds.length === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>গ্রুপ তৈরি করুন</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
