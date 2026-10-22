/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NoticeProvider } from './context/NoticeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { HomePage } from './pages/HomePage';
import { VideosPage } from './pages/VideosPage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { GamesPage } from './pages/GamesPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

// Part 2: Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Part 3: Feed & Detail Pages
import { BookmarksPage } from './pages/BookmarksPage';
import { PostDetailPage } from './pages/PostDetailPage';

// Part 4: Friends & Social Graph
import { FriendsPage } from './pages/FriendsPage';

// Part 5: Real-Time Calling & Live Streaming
import { CallProvider } from './context/CallContext';
import { LiveStreamPage } from './pages/LiveStreamPage';
import { LiveWatchPage } from './pages/LiveWatchPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NoticeProvider>
          <AuthProvider>
            <CallProvider>
              <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Public App Shell Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/communities" element={<CommunitiesPage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/:conversationId" element={<MessagesPage />} />
                  <Route path="/live" element={<LiveStreamPage />} />
                  <Route path="/live/:streamId" element={<LiveWatchPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
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
            </BrowserRouter>
          </CallProvider>
        </AuthProvider>
        </NoticeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
