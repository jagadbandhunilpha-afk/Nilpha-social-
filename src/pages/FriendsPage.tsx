/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Search,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { relationshipService } from '../services/relationshipService';
import { SocialUser, FriendRequestItem } from '../types';

export const FriendsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'followers' | 'following' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [incomingReqs, setIncomingReqs] = useState<FriendRequestItem[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<FriendRequestItem[]>([]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<SocialUser[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentUserId = user?.id || 'current-user';

  useEffect(() => {
    loadAllData();
  }, [currentUserId]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [f, inc, out, flwrs, flwng, disc] = await Promise.all([
        relationshipService.getFriends(currentUserId),
        relationshipService.getIncomingRequests(currentUserId),
        relationshipService.getOutgoingRequests(currentUserId),
        relationshipService.getFollowers(currentUserId),
        relationshipService.getFollowing(currentUserId),
        relationshipService.getSuggestedUsers(currentUserId),
      ]);

      setFriends(f);
      setIncomingReqs(inc);
      setOutgoingReqs(out);
      setFollowers(flwrs);
      setFollowing(flwng);
      setDiscoverUsers(disc);
    } catch (err) {
      console.error('Error loading relationship data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleAcceptFriend = async (req: FriendRequestItem) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: true }));
      await relationshipService.acceptFriendRequest(currentUserId, req.sender_id);
      setFeedbackMessage(language === 'bn' ? 'বন্ধুত্বের অনুরোধ গ্রহণ করা হয়েছে।' : 'Friend request accepted.');
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const handleRejectFriend = async (req: FriendRequestItem) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: true }));
      await relationshipService.rejectFriendRequest(currentUserId, req.sender_id);
      setFeedbackMessage(language === 'bn' ? 'অনুরোধ বাতিল করা হয়েছে।' : 'Friend request rejected.');
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const handleCancelSentRequest = async (req: FriendRequestItem) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: true }));
      await relationshipService.cancelFriendRequest(currentUserId, req.receiver_id);
      setFeedbackMessage(language === 'bn' ? 'অনুরোধ প্রত্যাহার করা হয়েছে।' : 'Friend request cancelled.');
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const handleUnfriend = async (targetUser: SocialUser) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি আনফ্রেন্ড করতে চান?' : 'Are you sure you want to unfriend?')) return;
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));
      await relationshipService.removeFriendship(currentUserId, targetUser.id);
      setFeedbackMessage(language === 'bn' ? 'বন্ধুত্ব অপসারণ করা হয়েছে।' : 'Removed friendship.');
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handleSendFriendRequest = async (targetUser: SocialUser) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));
      await relationshipService.sendFriendRequest(currentUserId, targetUser.id);
      setFeedbackMessage(language === 'bn' ? 'বন্ধুত্বের অনুরোধ পাঠানো হয়েছে।' : 'Friend request sent.');
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handleFollowToggle = async (targetUser: SocialUser, isCurrentlyFollowing: boolean) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));
      if (isCurrentlyFollowing) {
        await relationshipService.unfollow(currentUserId, targetUser.id);
      } else {
        await relationshipService.follow(currentUserId, targetUser.id);
      }
      await loadAllData();
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  // Filtered lists
  const filterBySearch = (list: SocialUser[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={language === 'bn' ? 'সোশ্যাল নেটওয়ার্ক ও বন্ধু' : 'Social Network & Friends'}
        subtitle={
          language === 'bn'
            ? 'আপনার বন্ধু তালিকা, অনুসারী, ফলোয়িং এবং ফ্রেন্ড রিকোয়েস্ট ম্যানেজ করুন'
            : 'Manage friends, follow relationships, and connection requests'
        }
        badge={
          <span className="text-xs font-bold text-[#155EEF] dark:text-[#38BDF8] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>পার্ট ৪ নেটওয়ার্ক</span>
          </span>
        }
      />

      {/* Supabase status notice if unconfigured */}
      {!isConfigured && <SupabaseConfigNotice className="mb-4" />}

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Tabs & Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'friends'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'bn' ? 'সব বন্ধু' : 'All Friends'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {friends.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'bn' ? 'অনুরোধ' : 'Requests'}</span>
              {incomingReqs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
                  {incomingReqs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('followers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'followers'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'bn' ? 'অনুসারী' : 'Followers'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                {followers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'bn' ? 'অনুসরণকারী' : 'Following'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                {following.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'discover'
                  ? 'bg-[#155EEF] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'bn' ? 'নতুন মানুষ' : 'Discover'}</span>
            </button>
          </div>

          <button
            onClick={loadAllData}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'নাম বা ইউজারনেম দিয়ে খুঁজুন...'
                : 'Search by display name or handle...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#155EEF]" />
          <span className="text-xs">{language === 'bn' ? 'নেটওয়ার্ক লোড হচ্ছে...' : 'Loading network...'}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TAB 1: ALL FRIENDS */}
          {activeTab === 'friends' && (
            <div>
              {filterBySearch(friends).length === 0 ? (
                <EmptyState
                  icon={<Users className="w-7 h-7" />}
                  title={language === 'bn' ? 'কোনো বন্ধু পাওয়া যায়নি' : 'No Friends Yet'}
                  description={
                    language === 'bn'
                      ? 'নতুন মানুষ ট্যাব থেকে বন্ধুদের রিকোয়েস্ট পাঠান অথবা আমন্ত্রণ জানান।'
                      : 'Connect with other users or send friend requests from the Discover tab.'
                  }
                  actionText={language === 'bn' ? 'নতুন মানুষ খুঁজুন' : 'Find People'}
                  onAction={() => setActiveTab('discover')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filterBySearch(friends).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <Link to={`/profile/${item.username}`} className="flex items-center gap-3 min-w-0 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#155EEF] to-[#06B6D4] text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
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

                      <button
                        onClick={() => handleUnfriend(item)}
                        disabled={actionLoadingMap[item.id]}
                        title={language === 'bn' ? 'আনফ্রেন্ড করুন' : 'Unfriend'}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === 'bn' ? 'আনফ্রেন্ড' : 'Unfriend'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS (INCOMING & OUTGOING) */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#155EEF]" />
                  <span>{language === 'bn' ? 'প্রাপ্ত ফ্রেন্ড রিকোয়েস্ট' : 'Received Requests'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {incomingReqs.length}
                  </span>
                </h3>

                {incomingReqs.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    {language === 'bn' ? 'বর্তমানে কোনো অপেক্ষমাণ ফ্রেন্ড রিকোয়েস্ট নেই।' : 'No pending friend requests.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingReqs.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <Link
                          to={`/profile/${req.sender?.username || 'user'}`}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {(req.sender?.display_name || 'U')[0]}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {req.sender?.display_name || 'ব্যবহারকারী'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{req.sender?.username || 'user'}
                            </span>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleAcceptFriend(req)}
                            disabled={actionLoadingMap[req.id]}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white flex items-center gap-1.5 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'গ্রহণ করুন' : 'Accept'}</span>
                          </button>
                          <button
                            onClick={() => handleRejectFriend(req)}
                            disabled={actionLoadingMap[req.id]}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Decline'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Sent Requests */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{language === 'bn' ? 'প্রেরিত ফ্রেন্ড রিকোয়েস্ট' : 'Sent Requests'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {outgoingReqs.length}
                  </span>
                </h3>

                {outgoingReqs.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    {language === 'bn' ? 'কোনো প্রেরিত রিকোয়েস্ট নেই।' : 'No sent requests pending.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outgoingReqs.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                            {(req.receiver?.display_name || 'U')[0]}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {req.receiver?.display_name || 'ব্যবহারকারী'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{req.receiver?.username || 'user'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelSentRequest(req)}
                          disabled={actionLoadingMap[req.id]}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 dark:text-slate-300"
                        >
                          {language === 'bn' ? 'রিকোয়েস্ট প্রত্যাহার' : 'Cancel Request'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FOLLOWERS */}
          {activeTab === 'followers' && (
            <div>
              {filterBySearch(followers).length === 0 ? (
                <EmptyState
                  icon={<Users className="w-7 h-7" />}
                  title={language === 'bn' ? 'কোনো অনুসারী পাওয়া যায়নি' : 'No Followers Yet'}
                  description={
                    language === 'bn'
                      ? 'নিয়মিত আকর্ষণীয় পোস্ট প্রকাশ করুন যাতে অন্য ব্যবহারকারীরা আপনাকে ফলো করে।'
                      : 'Post engaging updates so others can follow your journey.'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filterBySearch(followers).map((item) => {
                    const isFollowingThem = following.some((f) => f.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <Link to={`/profile/${item.username}`} className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {(item.display_name || 'U')[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                              {item.display_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono truncate block">
                              @{item.username}
                            </span>
                          </div>
                        </Link>

                        <button
                          onClick={() => handleFollowToggle(item, isFollowingThem)}
                          disabled={actionLoadingMap[item.id]}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                            isFollowingThem
                              ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-[#155EEF] text-white hover:bg-[#1048C6]'
                          }`}
                        >
                          {isFollowingThem ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'ফলো ব্যাক' : 'Follow Back'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FOLLOWING */}
          {activeTab === 'following' && (
            <div>
              {filterBySearch(following).length === 0 ? (
                <EmptyState
                  icon={<Users className="w-7 h-7" />}
                  title={language === 'bn' ? 'আপনি কাউকে ফলো করছেন না' : 'Not Following Anyone'}
                  description={
                    language === 'bn'
                      ? 'নতুন মানুষ ট্যাব থেকে প্রিয় ব্যক্তিত্বদের ফলো করুন।'
                      : 'Discover interesting people to follow.'
                  }
                  actionText={language === 'bn' ? 'মানুষ খুঁজুন' : 'Discover People'}
                  onAction={() => setActiveTab('discover')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filterBySearch(following).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <Link to={`/profile/${item.username}`} className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {(item.display_name || 'U')[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {item.display_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono truncate block">
                            @{item.username}
                          </span>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleFollowToggle(item, true)}
                        disabled={actionLoadingMap[item.id]}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {language === 'bn' ? 'আনফলো' : 'Unfollow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DISCOVER */}
          {activeTab === 'discover' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filterBySearch(discoverUsers).map((item) => {
                  const isFollowingThem = following.some((f) => f.id === item.id);
                  const isFriend = friends.some((f) => f.id === item.id);
                  const hasSentReq = outgoingReqs.some((r) => r.receiver_id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <Link to={`/profile/${item.username}`} className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
                          {(item.display_name || 'U')[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#155EEF] transition-colors truncate">
                              {item.display_name}
                            </span>
                            {item.verification_status === 'verified' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            @{item.username}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.bio || (language === 'bn' ? 'নিলফা সোশ্যাল সদস্য।' : 'Nilpha Social member.')}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Friend Action */}
                        {isFriend ? (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'বন্ধু' : 'Friends'}</span>
                          </span>
                        ) : hasSentReq ? (
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'অনুরোধ পাঠানো হয়েছে' : 'Requested'}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(item)}
                            disabled={actionLoadingMap[item.id]}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white flex items-center gap-1 shadow-2xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'ফ্রেন্ড রিকোয়েস্ট' : 'Add Friend'}</span>
                          </button>
                        )}

                        {/* Follow Action */}
                        <button
                          onClick={() => handleFollowToggle(item, isFollowingThem)}
                          disabled={actionLoadingMap[item.id]}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isFollowingThem
                              ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              : 'border border-[#155EEF] text-[#155EEF] hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          }`}
                        >
                          {isFollowingThem ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                            </>
                          ) : (
                            <span>{language === 'bn' ? 'ফলো' : 'Follow'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
