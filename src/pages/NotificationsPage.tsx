/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Gamepad2,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  Sparkles,
  PhoneMissed,
  Radio,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Award,
  X,
  Sliders,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { AppNotification, NotificationPreferences } from '../types';

export const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || 'demo-user-1';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'friends' | 'interactions' | 'groups' | 'system'>('all');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [preferencesOpen, setPreferencesOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [list, count, prefs] = await Promise.all([
        notificationService.getNotifications(userId, activeFilter),
        notificationService.getUnreadCount(userId),
        notificationService.getPreferences(userId),
      ]);
      setNotifications(list);
      setUnreadCount(count);
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Setup realtime subscription
    const unsubscribe = notificationService.subscribeToNotifications(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, activeFilter]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userId);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
    }
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  const handleSavePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    setSavingPrefs(true);
    const updated = await notificationService.updatePreferences(userId, updates);
    setPreferences(updated);
    setSavingPrefs(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'post_like':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'post_comment':
      case 'comment_reply':
      case 'mention':
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      case 'group_invite':
      case 'group_decision':
      case 'page_invite':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'missed_call':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'live_stream':
        return <Radio className="w-4 h-4 text-orange-500" />;
      case 'challenge_completed':
      case 'reward_eligible':
      case 'referral_milestone':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'security_alert':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#155EEF]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t('notificationsTitle')}
          subtitle="আপনার সামাজিক বন্ধন, মিথস্ক্রিয়া এবং প্ল্যাটফর্মের সর্বশেষ খবরাখবর"
          kicker="বিজ্ঞপ্তি ও অ্যালার্ট"
        />

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#155EEF] dark:text-[#38BDF8] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>সবগুলো পঠিত চিহ্নিত করুন</span>
            </button>
          )}

          <button
            onClick={() => setPreferencesOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            title="নোটিফিকেশন পছন্দসমূহ"
            aria-label="Notification Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DemoNotice message="বিজ্ঞপ্তি কেন্দ্র নিরাপদ সুপাবেস ডাটাবেজের সাথে সংহত। ব্যবহারকারী শুধুমাত্র নিজের বিজ্ঞপ্তি দেখতে পান।" />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>সকল বিজ্ঞপ্তি</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeFilter === 'unread'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          অপঠিত
        </button>

        <button
          onClick={() => setActiveFilter('friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeFilter === 'friends'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          বন্ধুত্ব ও ফলো
        </button>

        <button
          onClick={() => setActiveFilter('interactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeFilter === 'interactions'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          লাইক ও মন্তব্য
        </button>

        <button
          onClick={() => setActiveFilter('groups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeFilter === 'groups'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          গ্রুপ ও পেজ
        </button>

        <button
          onClick={() => setActiveFilter('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeFilter === 'system'
              ? 'bg-[#155EEF] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          সিস্টেম ও রিওয়ার্ড
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">
            বিজ্ঞপ্তি লোড হচ্ছে...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="কোনো বিজ্ঞপ্তি নেই"
              description="এই ক্যাটাগরিতে আপনার কোনো নতুন বিজ্ঞপ্তি নেই। নতুন আপডেট আসলে তা সাথে সাথে এখানে প্রদর্শিত হবে।"
              icon={<Bell className="w-8 h-8" />}
            />
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                notif.is_read
                  ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                  : 'bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Icon or Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  {notif.actor_avatar ? (
                    <img
                      src={notif.actor_avatar}
                      alt=""
                      className="w-10 h-10 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                      {notif.actor_name ? notif.actor_name.charAt(0).toUpperCase() : 'N'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-white dark:bg-[#151D2C] shadow-xs flex items-center justify-center p-0.5">
                    {getNotifIcon(notif.notification_type)}
                  </span>
                </div>

                {/* Notification Details */}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {notif.title}
                  </h4>
                  {notif.body && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono mt-1.5 block">
                    {new Date(notif.created_at).toLocaleString('bn-BD', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={(e) => handleMarkRead(notif.id, e)}
                    className="p-2 rounded-xl text-[#155EEF] hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors"
                    title="পঠিত চিহ্নিত করুন"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDismiss(notif.id, e)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preferences Modal */}
      {preferencesOpen && preferences && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setPreferencesOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-[#155EEF] dark:text-[#38BDF8]">
                <Settings className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  বিজ্ঞপ্তি পছন্দসমূহ (Preferences)
                </h3>
              </div>
              <button
                onClick={() => setPreferencesOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              কোন ধরনের নোটিফিকেশন পেতে চান তা নির্বাচন করুন। আপনার পছন্দ অনুযায়ী অ্যালার্ট নিয়ন্ত্রণ করা হবে।
            </p>

            <div className="space-y-3">
              {[
                { key: 'friend_requests', label: 'বন্ধুত্বের অনুরোধ ও ফলো অ্যালার্ট' },
                { key: 'likes_comments', label: 'পোস্টে লাইক ও মন্তব্যের নোটিফিকেশন' },
                { key: 'mentions_tags', label: 'মেনশন ও ট্যাগের নোটিফিকেশন' },
                { key: 'messages', label: 'নতুন বার্তার নোটিফিকেশন' },
                { key: 'groups_pages', label: 'গ্রুপ ও পেজের আমন্ত্রণ' },
                { key: 'calls_live', label: 'কল ও লাইভ সম্প্রচার অ্যালার্ট' },
                { key: 'rewards_challenges', label: 'দৈনিক চ্যালেঞ্জ ও রিওয়ার্ড অ্যালার্ট' },
                { key: 'security_alerts', label: 'অ্যাকাউন্ট নিরাপত্তা ও সুরক্ষা নোটিশ' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(preferences as any)[item.key]}
                    onChange={(e) =>
                      handleSavePreferences({ [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 text-[#155EEF] rounded-md focus:ring-[#155EEF]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreferencesOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
