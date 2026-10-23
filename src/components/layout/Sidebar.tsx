import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Tv,
  Users,
  Gamepad2,
  MessageSquare,
  Bell,
  Wallet,
  Bookmark,
  UserCheck,
  Radio,
  User,
  Settings,
  HelpCircle,
  LogIn,
  Gift,
  Trophy,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { adminService } from '../../services/adminService';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isStaff, setIsStaff] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setIsStaff(false);
      return;
    }

    notificationService.getUnreadCount(user.id).then(setUnreadCount);
    adminService.hasModeratorAccess(user.id).then(setIsStaff);

    const unsub = notificationService.subscribeToNotifications(user.id, () => {
      notificationService.getUnreadCount(user.id).then(setUnreadCount);
    });

    return () => unsub();
  }, [user]);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || (user ? user.email?.split('@')[0] : t('displayNameDemo'));
  const username = profile?.username ? `@${profile.username}` : user?.user_metadata?.username ? `@${user.user_metadata.username}` : (user ? `@${user.email?.split('@')[0]}` : t('usernameDemo'));

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'নিল';

  const mainNavLinks = [
    { path: '/', label: t('navHome'), icon: Home },
    { path: '/search', label: 'অনুসন্ধান', icon: Search },
    { path: '/videos', label: t('navVideos'), icon: Tv },
    { path: '/live', label: t('navLive'), icon: Radio },
    { path: '/communities', label: t('navCommunities'), icon: Users },
    { path: '/friends', label: t('navFriends'), icon: UserCheck },
    { path: '/games', label: t('navGames'), icon: Gamepad2 },
    { path: '/rewards', label: 'রিওয়ার্ড ও চ্যালেঞ্জ', icon: Gift },
    { path: '/leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
    { path: '/messages', label: t('navMessages'), icon: MessageSquare },
    {
      path: '/notifications',
      label: t('navNotifications'),
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
    },
    { path: '/bookmarks', label: t('navBookmarks'), icon: Bookmark },
    { path: '/wallet', label: t('navWallet'), icon: Wallet },
    { path: '/profile', label: t('navProfile'), icon: User },
  ];

  const secondaryNavLinks = [
    ...(isStaff ? [{ path: '/admin', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: ShieldCheck, highlight: true }] : []),
    { path: '/settings', label: t('navSettings'), icon: Settings },
    { path: '/help', label: t('navHelp'), icon: HelpCircle },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-3">
      {/* User Quick Card */}
      {user ? (
        <Link
          to="/profile"
          className="p-3.5 mb-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors block"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate font-mono">
              {username}
            </span>
          </div>
        </Link>
      ) : (
        <div className="p-3.5 mb-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            নিলফা সোশ্যালে স্বাগতম!
          </p>
          <Link
            to="/login"
            className="w-full py-2 px-3 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t('login')} / {t('register')}</span>
          </Link>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav aria-label="Main Navigation" className="space-y-1 mb-6">
        {mainNavLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-[#155EEF] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 dark:bg-blue-900/60 text-[#155EEF] dark:text-[#38BDF8]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mb-3">
        <span className="px-3.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2 block">
          অন্যান্য
        </span>
        <div className="space-y-1">
          {secondaryNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-[#155EEF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer subtle brand notes */}
      <div className="px-3.5 pt-3 pb-2 text-[11px] text-slate-400 dark:text-slate-600 leading-relaxed">
        <p>© 2026 Nilpha Social</p>
        <p className="mt-0.5">পার্ট ২ প্রমাণীকরণ সংস্করণ</p>
      </div>
    </aside>
  );
};
