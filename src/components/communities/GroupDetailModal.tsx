/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Globe,
  Lock,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/communityService';
import { SocialGroup, GroupMemberItem, GroupRole } from '../../types';

interface GroupDetailModalProps {
  group: SocialGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'requests'>('about');
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentUserId = user?.id || 'current-user';

  const userMembership = group?.currentUserMembership;
  const isMember = userMembership && userMembership.status === 'active';
  const isPending = userMembership && userMembership.status === 'pending';
  const isAdmin = userMembership?.role === 'admin' && isMember;

  useEffect(() => {
    if (isOpen && group) {
      loadMembers();
    }
  }, [isOpen, group?.id]);

  const loadMembers = async () => {
    if (!group) return;
    try {
      setIsLoadingMembers(true);
      const data = await communityService.getGroupMembers(group.id);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  if (!isOpen || !group) return null;

  const handleJoinOrLeave = async () => {
    try {
      setIsActionLoading(true);
      setActionMessage(null);
      if (isMember || isPending) {
        await communityService.leaveGroup(group.id, currentUserId);
        setActionMessage(language === 'bn' ? 'আপনি গ্রুপ ত্যাগ করেছেন।' : 'You left the group.');
      } else {
        const res = await communityService.joinGroup(group.id, currentUserId, group.privacy === 'private');
        if (res.status === 'pending') {
          setActionMessage(language === 'bn' ? 'যোগদানের অনুরোধ পাঠানো হয়েছে।' : 'Join request sent.');
        } else {
          setActionMessage(language === 'bn' ? 'গ্রুপে সফলভাবে যুক্ত হয়েছেন।' : 'Successfully joined the group.');
        }
      }
      onUpdate();
      await loadMembers();
    } catch (err: any) {
      console.error(err);
      setActionMessage(err.message || 'Operation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: GroupRole) => {
    try {
      await communityService.updateMemberRole(group.id, memberUserId, newRole);
      await loadMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestResponse = async (memberId: string, accept: boolean) => {
    try {
      await communityService.handleJoinRequest(group.id, memberId, accept);
      await loadMembers();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingMembers = members.filter((m) => m.status === 'pending');
  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 relative p-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              {group.privacy === 'public' ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>{language === 'bn' ? 'পাবলিক গ্রুপ' : 'Public Group'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>{language === 'bn' ? 'প্রাইভেট গ্রুপ' : 'Private Group'}</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Details */}
        <div className="px-6 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{group.name}</h2>
                {isAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{language === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
                  </span>
                )}
                {userMembership?.role === 'moderator' && (
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>{language === 'bn' ? 'মডারেটর' : 'Moderator'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">nilpha.social/g/{group.slug}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  {group.member_count.toLocaleString()} {language === 'bn' ? 'সদস্য' : 'members'}
                </span>
                <span>•</span>
                <span>
                  {language === 'bn' ? 'যুক্ত হয়েছেন: ' : 'Created: '}
                  {new Date(group.created_at).toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Action button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleJoinOrLeave}
                disabled={isActionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                  isMember
                    ? 'border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 dark:text-slate-300'
                    : isPending
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200'
                    : 'bg-[#155EEF] hover:bg-[#1048C6] text-white'
                }`}
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isMember ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'গ্রুপ ত্যাগ করুন' : 'Leave Group'}</span>
                  </>
                ) : isPending ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'অনুরোধ অপেক্ষমাণ' : 'Requested'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'যুক্ত হোন' : 'Join Group'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-[#155EEF] dark:text-[#38BDF8] flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'bn' ? 'পরিচিতি' : 'About'}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'bn' ? 'সদস্য তালিকা' : 'Members'} ({activeMembers.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{language === 'bn' ? 'আবেদনসমূহ' : 'Join Requests'}</span>
              {pendingMembers.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {language === 'bn' ? 'গ্রুপের মূল উদ্দেশ্য' : 'Group Purpose'}
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {group.description || (language === 'bn' ? 'কোনো বিবরণ যোগ করা হয়নি।' : 'No description provided.')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {language === 'bn' ? 'নিরাপত্তা ও অনুমতি (Role Permissions)' : 'Security & Permissions'}
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>
                    {language === 'bn'
                      ? 'অ্যাডমিন: গ্রুপ সম্পাদনা, সদস্য অনুমোদন, ও রোল নিয়ন্ত্রণ করতে পারেন।'
                      : 'Admin: Can edit group, approve join requests, and manage roles.'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'মডারেটর: আলোচনা পর্যবেক্ষণ ও সদস্য পর্যবেক্ষণ করতে পারেন।'
                      : 'Moderator: Can moderate discussions and monitor members.'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'সদস্য: গ্রুপে আলোচনা ও পোস্ট দেখতে ও অংশ নিতে পারেন।'
                      : 'Member: Can participate and interact with other community members.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              {isLoadingMembers ? (
                <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{language === 'bn' ? 'সদস্য লোড হচ্ছে...' : 'Loading members...'}</span>
                </div>
              ) : activeMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  {language === 'bn' ? 'কোনো সক্রিয় সদস্য পাওয়া যায়নি।' : 'No active members.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                          {(m.profile?.display_name || 'U')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {m.profile?.display_name || (m.user_id === currentUserId ? 'আপনি (Current User)' : 'ব্যবহারকারী')}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                m.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : m.role === 'moderator'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {m.role}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{m.profile?.username || 'member'}
                          </span>
                        </div>
                      </div>

                      {isAdmin && m.user_id !== currentUserId && (
                        <div className="flex items-center gap-2">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.user_id, e.target.value as GroupRole)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="member">সদস্য (Member)</option>
                            <option value="moderator">মডারেটর (Moderator)</option>
                            <option value="admin">অ্যাডমিন (Admin)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && isAdmin && (
            <div>
              {pendingMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  {language === 'bn' ? 'কোনো অপেক্ষমাণ আবেদন নেই।' : 'No pending join requests.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm">
                          {(m.profile?.display_name || 'U')[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {m.profile?.display_name || 'আবেদনকারী ব্যবহারকারী'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{m.profile?.username || 'user'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRequestResponse(m.id, true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'অনুমোদন' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleRequestResponse(m.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        >
                          {language === 'bn' ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
