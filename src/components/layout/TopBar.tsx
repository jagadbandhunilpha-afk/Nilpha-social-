import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Bell, MessageSquare, Compass, Shield, User, LogIn, LogOut, UserPlus, Bookmark, Users, Radio } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useNotice } from '../../context/NoticeContext';

export const TopBar: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useNotice();
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || (user ? user.email?.split('@')[0] : t('displayNameDemo'));
  const username = profile?.username ? `@${profile.username}` : user?.user_metadata?.username ? `@${user.user_metadata.username}` : (user ? `@${user.email?.split('@')[0]}` : t('usernameDemo'));

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'নিল';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (location.pathname !== '/' && location.pathname !== '/videos') {
        navigate(`/?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await signOut();
    showToast(t('logoutSuccess'));
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
            aria-label="Nilpha Social Home"
          >
            {/* Custom temporary professional logo mark */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#155EEF] to-[#06B6D4] p-0.5 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-white dark:bg-[#151D2C] rounded-[10px] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#155EEF] via-[#06B6D4] to-[#7C3AED] flex items-center justify-center">
                  <span className="text-white text-[10px] font-black tracking-tighter">N</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Nilpha <span className="text-[#155EEF] dark:text-[#38BDF8]">Social</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline leading-tight mt-0.5">
                {t('appName')}
              </span>
            </div>
          </Link>
        </div>

        {/* Search Field */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-[#155EEF] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Right Action Icons & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick links on tablet/desktop */}
          <Link
            to="/messages"
            aria-label={t('navMessages')}
            className={`min-h-[40px] min-w-[40px] hidden sm:flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs relative ${
              location.pathname === '/messages' ? 'text-[#155EEF] border-[#155EEF]/50 bg-blue-50/50 dark:bg-blue-950/30' : ''
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#155EEF]" />
          </Link>

          <Link
            to="/notifications"
            aria-label={t('navNotifications')}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs relative ${
              location.pathname === '/notifications' ? 'text-[#155EEF] border-[#155EEF]/50 bg-blue-50/50 dark:bg-blue-950/30' : ''
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444]" />
          </Link>

          <LanguageSelector compact />
          <ThemeToggle />

          {/* Account Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="User account menu"
                aria-expanded={accountMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white font-bold text-xs flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-xs">
                  {initials}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('login')}</span>
                </Link>
              </div>
            )}

            {accountMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setAccountMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100 text-sm">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {username}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{t('navProfile')}</span>
                  </Link>

                  <Link
                    to="/friends"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{t('navFriends')}</span>
                  </Link>

                  <Link
                    to="/live"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Radio className="w-4 h-4 text-red-500" />
                    <span>{t('navLive')}</span>
                  </Link>

                  <Link
                    to="/bookmarks"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    <span>{t('navBookmarks')}</span>
                  </Link>

                  <Link
                    to="/wallet"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Compass className="w-4 h-4 text-slate-400" />
                    <span>{t('navWallet')}</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>{t('navSettings')}</span>
                  </Link>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
