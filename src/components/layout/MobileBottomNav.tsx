import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Users, Gamepad2, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();

  const mobileDestinations = [
    { path: '/', label: t('navHome'), icon: Home },
    { path: '/videos', label: t('navVideos'), icon: Tv },
    { path: '/communities', label: t('navCommunities'), icon: Users },
    { path: '/games', label: t('navGames'), icon: Gamepad2 },
    { path: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden pb-safe transition-colors"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {mobileDestinations.map((dest) => {
          const Icon = dest.icon;
          return (
            <NavLink
              key={dest.path}
              to={dest.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#155EEF] dark:text-[#38BDF8] font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5 transition-transform" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#155EEF] dark:bg-[#38BDF8]" />
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
                    {dest.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
