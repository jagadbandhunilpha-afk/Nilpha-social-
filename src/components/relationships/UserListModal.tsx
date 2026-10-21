/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, UserPlus, UserCheck, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { relationshipService } from '../../services/relationshipService';
import { SocialUser } from '../../types';

interface UserListModalProps {
  title: string;
  type: 'followers' | 'following' | 'friends';
  users: SocialUser[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  title,
  users,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const currentUserId = user?.id || 'current-user';

  if (!isOpen) return null;

  const handleFollowToggle = async (targetUser: SocialUser) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));
      if (targetUser.isFollowing) {
        await relationshipService.unfollow(currentUserId, targetUser.id);
        targetUser.isFollowing = false;
      } else {
        await relationshipService.follow(currentUserId, targetUser.id);
        targetUser.isFollowing = true;
      }
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#155EEF] dark:text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {users.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {users.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              {language === 'bn' ? 'কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No users found.'}
            </div>
          ) : (
            users.map((item) => {
              const isMe = item.id === currentUserId;
              const isLoading = !!loadingMap[item.id];

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors"
                >
                  <Link
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#06B6D4] text-white font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      {(item.display_name || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#155EEF] transition-colors truncate">
                          {item.display_name}
                        </span>
                        {item.verification_status === 'verified' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">
                        @{item.username}
                      </span>
                    </div>
                  </Link>

                  {!isMe && (
                    <button
                      onClick={() => handleFollowToggle(item)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                        item.isFollowing
                          ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          : 'bg-[#155EEF] hover:bg-[#1048C6] text-white'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : item.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'ফলো' : 'Follow'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
