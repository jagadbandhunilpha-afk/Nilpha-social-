import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { DevelopmentModal } from '../common/DevelopmentModal';
import { useNotice } from '../../context/NoticeContext';
import { CheckCircle2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { toast } = useNotice();

  // Show right sidebar primarily on feed/discover pages
  const showRightSidebar =
    location.pathname === '/' ||
    location.pathname === '/communities' ||
    location.pathname === '/games';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col transition-colors selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Top Bar */}
      <TopBar />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 flex gap-6">
        {/* Left Desktop Sidebar */}
        <Sidebar />

        {/* Central Content Outlet */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-10">
          <Outlet />
        </main>

        {/* Right Desktop Sidebar */}
        {showRightSidebar && <RightSidebar />}
      </div>

      {/* Mobile Fixed Bottom Nav */}
      <MobileBottomNav />

      {/* Global Interactive Development Modal */}
      <DevelopmentModal />

      {/* Global Toast */}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
