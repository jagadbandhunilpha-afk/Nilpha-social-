import React, { useState } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Gamepad2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';
import { NotificationItem } from '../types';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    sender: 'তানভীর আহমেদ',
    actionKey: 'আপনার সাম্প্রতিক ডেমো পোস্টে পছন্দ করেছেন।',
    timestamp: '১৫ মিনিট আগে',
    read: false,
    type: 'like',
  },
  {
    id: 'notif-2',
    sender: 'বাংলাদেশ টেক হাব',
    actionKey: 'গ্রুপে একটি নতুন আলোচনা পোস্ট করা হয়েছে।',
    timestamp: '১ ঘণ্টা আগে',
    read: false,
    type: 'community',
  },
  {
    id: 'notif-3',
    sender: 'সাবিহা সুলতানা',
    actionKey: 'আপনার শেয়ার করা ফিড পোস্টে একটি মন্তব্য করেছেন।',
    timestamp: '৩ ঘণ্টা আগে',
    read: true,
    type: 'comment',
  },
  {
    id: 'notif-4',
    sender: 'নিলফা গেমস এরিনা',
    actionKey: 'সপ্তাহের মেমোরি ম্যাচ চ্যালেঞ্জে নতুন রেকর্ড হয়েছে।',
    timestamp: 'গতকাল',
    read: true,
    type: 'game',
  },
];

export const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useNotice();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter(
    (n) => (activeTab === 'all' ? true : !n.read)
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('সবগুলো নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে');
  };

  const toggleSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'community':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#155EEF]" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t('notificationsTitle')}
        subtitle={t('notificationsSubtitle')}
        kicker="বিজ্ঞপ্তি কেন্দ্র"
        action={
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('markAllRead')}</span>
          </button>
        }
      />

      <DemoNotice
        className="mb-5"
        message="সকল নোটিফিকেশন ডেমো হিসেবে তৈরি করা হয়েছে। কোনো আসল ব্যবহারকারী কার্যকলাপ নেই।"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-fit mb-5">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabAllNotifications')} ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'unread'
              ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabUnreadNotifications')} ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifs.length > 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => toggleSingleRead(notif.id)}
              className={`p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                !notif.read
                  ? 'bg-blue-50/50 dark:bg-blue-950/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                      {notif.sender}
                    </span>
                    {notif.actionKey}
                  </p>
                  {/* Zero-Pill text metadata */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <span>{notif.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px]">ডেমো বিজ্ঞপ্তি</span>
                  </div>
                </div>
              </div>

              {!notif.read && (
                <span
                  title="অপঠিত"
                  className="w-2.5 h-2.5 rounded-full bg-[#155EEF] shrink-0 mt-2"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('emptyNotificationsTitle')}
          description={t('emptyNotificationsDesc')}
          icon={<Bell className="w-8 h-8" />}
        />
      )}
    </div>
  );
};
