/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Settings,
  Calendar,
  Globe,
  Edit3,
  Shield,
  ShieldCheck,
  LogIn,
  UserPlus,
  UserCheck,
  UserMinus,
  CheckCircle2,
  Users,
  Clock,
  MoreVertical,
  Ban,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';
import { UserListModal } from '../components/relationships/UserListModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { relationshipService } from '../services/relationshipService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  RelationshipCounts,
  UserRelationshipState,
  SocialUser,
} from '../types';

export const ProfilePage: React.FC = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const { language, t } = useLanguage();
  const { user, profile: myProfile, isConfigured } = useAuth();

  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');

  // Counts & Relationship
  const [counts, setCounts] = useState<RelationshipCounts>({
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
  });
  const [relState, setRelState] = useState<UserRelationshipState>({
    isFollowing: false,
    isFollower: false,
    friendStatus: 'none',
    isBlocked: false,
  });
  const [isRelActionLoading, setIsRelActionLoading] = useState(false);

  // User list modal state
  const [modalType, setModalType] = useState<'followers' | 'following' | 'friends' | null>(null);
  const [modalUsers, setModalUsers] = useState<SocialUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if viewing self or another user
  const isViewingSelf =
    !routeUsername ||
    (myProfile && myProfile.username.toLowerCase() === routeUsername.toLowerCase()) ||
    (user?.user_metadata?.username &&
      user.user_metadata.username.toLowerCase() === routeUsername.toLowerCase());

  const currentUserId = user?.id || 'current-user';

  // Load target profile
  useEffect(() => {
    if (isViewingSelf) {
      setTargetProfile(myProfile);
      loadRelationshipData(myProfile?.id || currentUserId);
    } else if (routeUsername) {
      loadOtherProfile(routeUsername);
    }
  }, [routeUsername, isViewingSelf, myProfile?.id]);

  const loadOtherProfile = async (uName: string) => {
    try {
      setIsLoadingProfile(true);
      if (!isSupabaseConfigured || !supabase) {
        // Mock profile for offline preview
        const mock: any = {
          id: 'demo-user-' + uName,
          username: uName,
          display_name: uName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          bio: 'নিলফা সোশ্যাল এক্সপ্লোরার ও কমিউনিটি সক্রিয় সদস্য।',
          verification_status: 'verified',
          created_at: new Date(Date.now() - 3600000 * 24 * 120).toISOString(),
        };
        setTargetProfile(mock);
        await loadRelationshipData(mock.id);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', uName.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      setTargetProfile(data);
      if (data) {
        await loadRelationshipData(data.id);
      }
    } catch (err) {
      console.error('Error fetching target profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadRelationshipData = async (targetId: string) => {
    try {
      const c = await relationshipService.getCounts(targetId);
      setCounts(c);

      if (!isViewingSelf) {
        const state = await relationshipService.getRelationshipState(currentUserId, targetId);
        setRelState(state);
      }
    } catch (err) {
      console.error('Error loading relationship data:', err);
    }
  };

  // Actions on target user
  const handleFollowToggle = async () => {
    if (!targetProfile) return;
    try {
      setIsRelActionLoading(true);
      if (relState.isFollowing) {
        await relationshipService.unfollow(currentUserId, targetProfile.id);
      } else {
        await relationshipService.follow(currentUserId, targetProfile.id);
      }
      await loadRelationshipData(targetProfile.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRelActionLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!targetProfile) return;
    try {
      setIsRelActionLoading(true);
      if (relState.friendStatus === 'friends') {
        if (window.confirm(language === 'bn' ? 'আপনি কি আনফ্রেন্ড করতে চান?' : 'Unfriend this user?')) {
          await relationshipService.removeFriendship(currentUserId, targetProfile.id);
        }
      } else if (relState.friendStatus === 'pending_sent') {
        await relationshipService.cancelFriendRequest(currentUserId, targetProfile.id);
      } else if (relState.friendStatus === 'pending_received') {
        await relationshipService.acceptFriendRequest(currentUserId, targetProfile.id);
      } else {
        await relationshipService.sendFriendRequest(currentUserId, targetProfile.id);
      }
      await loadRelationshipData(targetProfile.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRelActionLoading(false);
    }
  };

  const handleOpenListModal = async (type: 'followers' | 'following' | 'friends') => {
    const targetId = targetProfile?.id || currentUserId;
    setModalType(type);
    setIsModalOpen(true);

    try {
      if (type === 'followers') {
        const data = await relationshipService.getFollowers(targetId);
        setModalUsers(data);
      } else if (type === 'following') {
        const data = await relationshipService.getFollowing(targetId);
        setModalUsers(data);
      } else {
        const data = await relationshipService.getFriends(targetId);
        setModalUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayName =
    targetProfile?.display_name || (isViewingSelf ? user?.user_metadata?.display_name : '') || t('displayNameDemo');
  const username = targetProfile?.username
    ? `@${targetProfile.username}`
    : isViewingSelf && user?.user_metadata?.username
    ? `@${user.user_metadata.username}`
    : t('usernameDemo');
  const bio = targetProfile?.bio || t('bioDemo');
  const preferredLang = targetProfile?.preferred_language === 'en' ? 'English' : 'বাংলা';
  const joinedDate = targetProfile?.created_at
    ? new Date(targetProfile.created_at).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })
    : t('joinedDate');

  const initials =
    displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'নিল';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* If user is not authenticated and viewing own profile */}
      {!user && isViewingSelf && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151D2C] border border-blue-200 dark:border-blue-900/60 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-[#155EEF] dark:text-[#38BDF8] tracking-wider uppercase mb-1 block">
                অ্যাকাউন্ট ভিউয়ার
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                আপনার নিজস্ব প্রোফাইল ও নেটওয়ার্ক পরিচালনা করতে লগইন করুন
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                পার্ট ৪-এ ফলোয়ার, ফ্রেন্ড রিকোয়েস্ট ও কমিউনিটি রোলস সংযুক্ত রয়েছে।
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('register')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Supabase status notice if unconfigured */}
      {!isConfigured && <SupabaseConfigNotice className="mb-4" />}

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Cover Photo */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-blue-700 via-cyan-700 to-indigo-900 relative p-4 flex items-end justify-end">
          <span className="text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
            কভার ব্যানার
          </span>
        </div>

        {/* Profile Details Container */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-[#155EEF] via-[#06B6D4] to-[#7C3AED] text-white font-bold text-3xl sm:text-4xl flex items-center justify-center ring-4 ring-white dark:ring-[#151D2C] shadow-lg">
                {initials}
              </div>
            </div>

            {/* Actions: Edit Profile, Settings OR Follow/Friend if viewing someone else */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {isViewingSelf ? (
                <>
                  {user ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('editProfile')}</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>লগইন করুন</span>
                    </Link>
                  )}

                  <Link
                    to="/friends"
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[#155EEF] dark:text-[#38BDF8] transition-colors flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>নেটওয়ার্ক হাব</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('profileSettings')}</span>
                  </Link>
                </>
              ) : (
                /* Viewing other user's profile */
                <>
                  {/* Friend Request Action */}
                  <button
                    onClick={handleFriendAction}
                    disabled={isRelActionLoading}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                      relState.friendStatus === 'friends'
                        ? 'border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        : relState.friendStatus === 'pending_sent'
                        ? 'border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        : relState.friendStatus === 'pending_received'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#155EEF] hover:bg-[#1048C6] text-white'
                    }`}
                  >
                    {isRelActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : relState.friendStatus === 'friends' ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>বন্ধু (Friends)</span>
                      </>
                    ) : relState.friendStatus === 'pending_sent' ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>অনুরোধ প্রেরিত (Pending)</span>
                      </>
                    ) : relState.friendStatus === 'pending_received' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>অনুরোধ গ্রহণ করুন (Accept)</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>বন্ধুত্ব পাঠান (Add Friend)</span>
                      </>
                    )}
                  </button>

                  {/* Follow Action */}
                  <button
                    onClick={handleFollowToggle}
                    disabled={isRelActionLoading}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                      relState.isFollowing
                        ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'border-[#155EEF] text-[#155EEF] hover:bg-blue-50 dark:hover:bg-blue-950/40'
                    }`}
                  >
                    {relState.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>ফলো করছেন</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>ফলো করুন</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User info text */}
          <div className="mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {displayName}
              </h1>
              {targetProfile?.verification_status === 'verified' && (
                <span className="text-[11px] font-semibold text-[#155EEF] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ভেরিফাইড অ্যাকাউন্ট</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {username}
            </p>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl">
              {bio}
            </p>

            {/* PART 4: REAL SOCIAL RELATIONSHIP COUNTERS */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm">
              <button
                onClick={() => handleOpenListModal('friends')}
                className="hover:underline text-left group cursor-pointer"
              >
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#155EEF] mr-1">
                  {counts.friendsCount}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'বন্ধু' : 'Friends'}
                </span>
              </button>

              <button
                onClick={() => handleOpenListModal('followers')}
                className="hover:underline text-left group cursor-pointer"
              >
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#155EEF] mr-1">
                  {counts.followersCount}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'অনুসারী' : 'Followers'}
                </span>
              </button>

              <button
                onClick={() => handleOpenListModal('following')}
                className="hover:underline text-left group cursor-pointer"
              >
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#155EEF] mr-1">
                  {counts.followingCount}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'অনুসরণ করছেন' : 'Following'}
                </span>
              </button>
            </div>

            {/* Zero-Pill details */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-3.5">
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>ভাষা: {preferredLang}</span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>যুক্ত হয়েছেন: {joinedDate}</span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>স্ট্যাটাস: সক্রিয়</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center px-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>প্রোফাইল বিবরণ</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-[#155EEF] text-[#155EEF] dark:text-[#38BDF8]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>নিরাপত্তা ও অনুমতি (RLS)</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              অ্যাকাউন্ট ও নিরাপত্তা সারাংশ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">ইমেইল ঠিকানা</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {isViewingSelf ? user?.email || 'ডেমো ইউজার / সাইন ইন করেননি' : 'সুরক্ষিত (Private)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">সুপাবেস ইউজার আইডি</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block">
                  {targetProfile?.id || (isViewingSelf ? user?.id : 'demo-user-id')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            পার্ট ৪ রো লেভেল সিকিউরিটি (RLS) ও অ্যাক্সেস কন্ট্রোল
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            সুপাবেস পোস্টগ্রেস ডাটাবেজে সক্রিয় RLS পলিসির মাধ্যমে রিলেশনশিপ ও কমিউনিটি অ্যাক্সেস নিয়ন্ত্রিত হয়:
          </p>
          <div className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              ✓ follows: follower_id = auth.uid() দ্বারা ফলো/আনফলো সুরক্ষিত
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              ✓ friend_requests: শুধুমাত্র প্রেরক বা প্রাপক স্ট্যাটাস অ্যাক্সেস ও আপডেট করতে পারে
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              ✓ group_members: 'admin' রোলধারীরা সদস্য ও আবেদন অনুমোদন করতে পারেন
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              ✓ pages: 'admin' বা 'editor' রোলধারীরা পেইজ সম্পাদনা করতে পারেন
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isViewingSelf && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentProfile={myProfile}
        />
      )}

      {/* User List Modal for Followers/Following/Friends */}
      <UserListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType || 'followers'}
        title={
          modalType === 'followers'
            ? language === 'bn'
              ? 'অনুসারী তালিকা'
              : 'Followers'
            : modalType === 'following'
            ? language === 'bn'
              ? 'অনুসরণ করছেন'
              : 'Following'
            : language === 'bn'
            ? 'বন্ধু তালিকা'
            : 'Friends'
        }
        users={modalUsers}
        onUpdate={() => targetProfile && loadRelationshipData(targetProfile.id)}
      />
    </div>
  );
};
