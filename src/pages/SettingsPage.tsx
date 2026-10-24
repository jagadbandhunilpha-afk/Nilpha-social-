import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Sun,
  Moon,
  Shield,
  Bell,
  Eye,
  HelpCircle,
  ExternalLink,
  Check,
  Lock,
  LogOut,
  KeyRound,
  Trash2,
  Mail,
  UserCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { openNotice, showToast } = useNotice();
  const { user, profile, signOut, updatePassword, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account Deactivation & Deletion states (Part 8)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePlaceholderToggle = (sectionName: string) => {
    openNotice(
      sectionName,
      t('backendNotice'),
      'ব্যবহারকারীর অ্যাকাউন্টের স্থায়ী ক্লাউড প্রেফারেন্স সংরক্ষণ পরবর্তী ধাপে সক্রিয় হবে।'
    );
  };

  const handleLogout = async () => {
    await signOut();
    showToast(t('logoutSuccess'));
    navigate('/login');
  };

  const handleDeactivateAccount = async () => {
    if (!user) return;
    setDeactivateLoading(true);
    const res = await accountService.deactivateAccount(user.id, deactivateReason);
    setDeactivateLoading(false);
    if (res.success) {
      showToast(res.message);
      setShowDeactivateModal(false);
      await signOut();
      navigate('/login');
    } else {
      showToast(res.message || 'নিষ্ক্রিয় করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteError(null);
    setDeleteLoading(true);
    const res = await accountService.deleteAccount(user.id, deleteConfirmText);
    setDeleteLoading(false);
    if (res.success) {
      showToast(res.message);
      setShowDeleteModal(false);
      await signOut();
      navigate('/login');
    } else {
      setDeleteError(res.message);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError(t('errorPasswordShort'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('errorPasswordMismatch'));
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        showToast(t('passwordResetSuccess'));
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch {
      setPasswordError(t('errorGenericAuth'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccountNotice = () => {
    openNotice(
      t('deleteAccount'),
      t('deleteAccountNotice'),
      'ডেটা নিরাপত্তা বিধিমালার অংশ হিসেবে ব্যাকএন্ড ও অ্যাডমিন সার্ভিস রোলের মাধ্যমে অ্যাকাউন্ট ডাটা শুদ্ধিকরণ সম্পন্ন হয়।'
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t('settingsTitle')}
        subtitle={t('settingsSubtitle')}
        kicker="কাস্টমাইজেশন ও নিরাপত্তা"
      />

      {/* Supabase status notice if unconfigured */}
      {!isConfigured && <SupabaseConfigNotice className="mb-6" />}

      <div className="space-y-6">
        {/* Section 0: Real Account & Security (Part 2) */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#155EEF] dark:text-[#38BDF8]" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('accountSecurity')}
              </h2>
            </div>
            {user ? (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {t('statusActive')}
              </span>
            ) : (
              <span className="text-xs text-slate-400">সাইন ইন করা নেই</span>
            )}
          </div>

          {user ? (
            <div className="space-y-4">
              {/* Account Email Info */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs text-slate-400 block">{t('email')}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">নিবন্ধিত</span>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">{t('accountStatus')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.account_status === 'active' ? t('statusActive') : 'সাধারণ'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">{t('verificationStatus')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.verification_status === 'verified' ? t('verifiedApproved') : t('verifiedNone')}
                  </span>
                </div>
              </div>

              {/* Password Change Action */}
              <div className="pt-2">
                {isChangingPassword ? (
                  <form onSubmit={handleChangePasswordSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('changePassword')}
                    </h4>
                    {passwordError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                    )}
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#155EEF]"
                    />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড নিশ্চিত করুন"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#155EEF]"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#155EEF] text-white rounded-lg hover:bg-[#1048C6] flex items-center gap-1.5"
                      >
                        {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>আপডেট করুন</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      <span>{t('changePassword')}</span>
                    </div>
                    <span className="text-xs text-[#155EEF]">পরিবর্তন</span>
                  </button>
                )}
              </div>

              {/* Account Actions & Danger Zone */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="py-2 px-3 rounded-lg text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium transition-colors"
                  >
                    নিষ্ক্রিয় করুন
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeleteError(null);
                      setShowDeleteModal(true);
                    }}
                    className="py-2 px-3 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteAccount')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                আপনার পাসওয়ার্ড বা অ্যাকাউন্ট সেটিংস পরিবর্তন করতে প্রথমে লগইন করুন।
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] text-white hover:bg-[#1048C6] transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Section 1: Language */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <Globe className="w-5 h-5 text-[#155EEF]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('sectionLanguage')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('sectionLanguageDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setLanguage('bn');
                showToast('ইন্টারফেসের ভাষা বাংলায় পরিবর্তিত হয়েছে');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                language === 'bn'
                  ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30 text-[#155EEF] dark:text-[#38BDF8] ring-1 ring-[#155EEF]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <p className="font-bold text-sm">বাংলা (Bengali)</p>
                <p className="text-xs text-slate-400">প্রাথমিক ভাষা</p>
              </div>
              {language === 'bn' && <Check className="w-4 h-4 text-[#155EEF]" />}
            </button>

            <button
              onClick={() => {
                setLanguage('en');
                showToast('Language changed to English');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                language === 'en'
                  ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30 text-[#155EEF] dark:text-[#38BDF8] ring-1 ring-[#155EEF]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <p className="font-bold text-sm">English (ইংরেজি)</p>
                <p className="text-xs text-slate-400">International</p>
              </div>
              {language === 'en' && <Check className="w-4 h-4 text-[#155EEF]" />}
            </button>
          </div>
        </section>

        {/* Section 2: Appearance (Light / Dark) */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('sectionAppearance')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('sectionAppearanceDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTheme('light');
                showToast('হালকা মোড সক্রিয় করা হয়েছে');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                theme === 'light'
                  ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30 text-[#155EEF] dark:text-[#38BDF8] ring-1 ring-[#155EEF]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">{t('themeLight')}</p>
                  <p className="text-xs text-slate-400">উজ্জ্বল ও স্পষ্ট</p>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-[#155EEF]" />}
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                showToast('ডার্ক মোড সক্রিয় করা হয়েছে');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                theme === 'dark'
                  ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/30 text-[#155EEF] dark:text-[#38BDF8] ring-1 ring-[#155EEF]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">{t('themeDark')}</p>
                  <p className="text-xs text-slate-400">চোখের আরামদায়ক</p>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-[#155EEF]" />}
            </button>
          </div>
        </section>

        {/* Section 3: Privacy placeholder */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('sectionPrivacy')}
              </h2>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md font-mono">
              পরবর্তী ধাপ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('sectionPrivacyDesc')}
          </p>

          <div className="space-y-2">
            {[
              { label: 'প্রোফাইল দৃশ্যমানতা (পাবলিক / শুধু বন্ধু)', key: 'visibility' },
              { label: 'সক্রিয় অনলাইন অবস্থা গোপন রাখুন', key: 'online' },
              { label: 'ব্যক্তিগত বার্তা গ্রহণ নিয়ন্ত্রণ', key: 'dm' },
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => handlePlaceholderToggle(item.label)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {item.label}
                </span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Notifications placeholder */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-[#06B6D4]" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('sectionNotificationsPref')}
              </h2>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md font-mono">
              পরবর্তী ধাপ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('sectionNotificationsPrefDesc')}
          </p>

          <div className="space-y-2">
            {[
              { label: 'পোস্টে নতুন পছন্দ ও মন্তব্য বিজ্ঞপ্তি', key: 'reactions' },
              { label: 'কমিউনিটি ইভেন্ট ও ঘোষণা', key: 'groups' },
              { label: 'নতুন বার্তার সরাসরি পুশ অ্যালার্ট', key: 'messages' },
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => handlePlaceholderToggle(item.label)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {item.label}
                </span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Accessibility */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('sectionAccessibility')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('sectionAccessibilityDesc')}
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('reducedMotion')}
              </span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => {
                  setReducedMotion(e.target.checked);
                  showToast(
                    e.target.checked
                      ? 'অ্যানিমেশন হ্রাস করা হয়েছে'
                      : 'স্ট্যান্ডার্ড অ্যানিমেশন বহাল'
                  );
                }}
                className="w-4 h-4 rounded text-[#155EEF] focus:ring-[#155EEF]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('highContrast')}
              </span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => {
                  setHighContrast(e.target.checked);
                  showToast(
                    e.target.checked
                      ? 'হাই কনট্রাস্ট মোড চালু'
                      : 'স্ট্যান্ডার্ড কনট্রাস্ট চালু'
                  );
                }}
                className="w-4 h-4 rounded text-[#155EEF] focus:ring-[#155EEF]"
              />
            </label>
          </div>
        </section>

        {/* Section 6: Help and Support shortcut */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('navHelp')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                প্রশ্নোত্তর, সাপোর্ট অনুরোধ এবং কমিউনিটি নীতিমালা
              </p>
            </div>
          </div>
          <Link
            to="/help"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>দেখুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </section>
      </div>

      {/* Account Deactivation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              অ্যাকাউন্ট সাময়িক নিষ্ক্রিয়করণ
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              অ্যাকাউন্ট নিষ্ক্রিয় করলে আপনার প্রোফাইল ও পোস্ট সাময়িকভাবে লুকানো থাকবে। আপনি পরবর্তীতে পুনরায় লগইন করে সক্রিয় করতে পারবেন।
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                নিষ্ক্রিয়করণের কারণ (ঐচ্ছিক)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="একটি কারণ উল্লেখ করুন..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deactivateLoading}
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={deactivateLoading}
                onClick={handleDeactivateAccount}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
              >
                {deactivateLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>নিষ্ক্রিয় নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal (Permanent) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#151D2C] rounded-2xl border border-red-200 dark:border-red-900/60 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                স্থায়ী অ্যাকাউন্ট মুছে ফেলা
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              সতর্কতা: এটি একটি অপরিবর্তনীয় পদক্ষেপ। আপনার সমস্ত ব্যক্তিগত তথ্য, পোস্ট, বন্ধুত্ব এবং বার্তা সম্পূর্ণরূপে মুছে বা অ্যানোনিমাস করা হবে। আর্থিক অডিট সম্মতি নিশ্চিত করতে ডেমো কয়েন লেজার রেকর্ড অপরিবর্তিত থাকবে।
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/40">
                {deleteError}
              </p>
            )}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                নিশ্চিত করতে নিচে <span className="font-mono font-bold text-red-500">DELETE</span> লিখুন:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={deleteLoading || deleteConfirmText.trim() !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white flex items-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>স্থায়ীভাবে মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
