/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NoticeProvider } from './context/NoticeContext';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Core Landing & Home
import { HomePage } from './pages/HomePage';

// Lazy-loaded routes for code-splitting and performance optimization
const VideosPage = lazy(() => import('./pages/VideosPage').then(m => ({ default: m.VideosPage })));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage').then(m => ({ default: m.CommunitiesPage })));
const GamesPage = lazy(() => import('./pages/GamesPage').then(m => ({ default: m.GamesPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const WalletPage = lazy(() => import('./pages/WalletPage').then(m => ({ default: m.WalletPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));

// Part 2: Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));

// Part 6: Games Hub, Demo Coins Wallet, Rewards, Referrals, Leaderboards
const RewardsPage = lazy(() => import('./pages/RewardsPage').then(m => ({ default: m.RewardsPage })));
const ReferralsPage = lazy(() => import('./pages/ReferralsPage').then(m => ({ default: m.ReferralsPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));

// Part 3: Feed & Detail Pages
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then(m => ({ default: m.PostDetailPage })));

// Part 4: Friends & Social Graph
const FriendsPage = lazy(() => import('./pages/FriendsPage').then(m => ({ default: m.FriendsPage })));

// Part 5: Real-Time Calling & Live Streaming
const LiveStreamPage = lazy(() => import('./pages/LiveStreamPage').then(m => ({ default: m.LiveStreamPage })));
const LiveWatchPage = lazy(() => import('./pages/LiveWatchPage').then(m => ({ default: m.LiveWatchPage })));

// Part 7: Search & Admin Dashboard
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));

const RouteLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-slate-500">
    <Loader2 className="w-8 h-8 text-[#155EEF] animate-spin mb-3" />
    <span className="text-xs font-medium">লোড হচ্ছে...</span>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NoticeProvider>
            <AuthProvider>
              <CallProvider>
                <BrowserRouter>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Routes>
                      <Route element={<AppLayout />}>
                        {/* Public App Shell Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/videos" element={<VideosPage />} />
                        <Route path="/communities" element={<CommunitiesPage />} />
                        <Route path="/games" element={<GamesPage />} />
                        <Route path="/games/:gameId" element={<GamesPage />} />
                        <Route path="/rewards" element={<RewardsPage />} />
                        <Route path="/referrals" element={<ReferralsPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/achievements" element={<LeaderboardPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:conversationId" element={<MessagesPage />} />
                        <Route path="/live" element={<LiveStreamPage />} />
                        <Route path="/live/:streamId" element={<LiveWatchPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/wallet" element={<WalletPage />} />
                        <Route path="/friends" element={<FriendsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/:username" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/help" element={<HelpPage />} />

                        <Route path="/bookmarks" element={<BookmarksPage />} />
                        <Route path="/posts/:postId" element={<PostDetailPage />} />

                        {/* Part 2: Authentication Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />

                        {/* Fallback to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </CallProvider>
            </AuthProvider>
          </NoticeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
