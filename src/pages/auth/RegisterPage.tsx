import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, AtSign, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { SupabaseConfigNotice } from '../../components/auth/SupabaseConfigNotice';

export const RegisterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { signUp, isConfigured } = useAuth();
  const { showToast } = useNotice();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = displayName.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    // Client-side validations
    if (!trimmedName) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে আপনার পুরো নাম দিন।' : 'Please enter your full name.');
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      setErrorMessage(t('errorUsernameInvalid'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(t('errorInvalidEmail'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('errorPasswordShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('errorPasswordMismatch'));
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(t('errorTermsRequired'));
      return;
    }

    if (!isConfigured) {
      setErrorMessage(t('supabaseNotConfiguredDesc'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error, needsEmailVerification } = await signUp({
        email: trimmedEmail,
        password,
        username: normalizedUsername,
        displayName: trimmedName,
        preferredLanguage: language,
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('unique constraint')) {
          setErrorMessage(t('errorUserAlreadyRegistered'));
        } else if (error.message.includes('username is already taken')) {
          setErrorMessage(t('errorUsernameTaken'));
        } else {
          setErrorMessage(error.message || t('errorGenericAuth'));
        }
      } else {
        if (needsEmailVerification) {
          setVerificationRequired(true);
          showToast(t('checkEmailVerification'));
        } else {
          showToast(t('loginSuccess'));
          navigate('/profile', { replace: true });
        }
      }
    } catch {
      setErrorMessage(t('errorGenericAuth'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="max-w-md mx-auto my-8 px-4">
        <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t('emailVerificationRequiredTitle')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {t('emailVerificationRequiredDesc')}
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-mono mb-6">
            ইমেইল: {email}
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors"
          >
            <span>{t('backToLogin')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-6 px-4">
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#155EEF] to-[#06B6D4] p-0.5 shadow-md flex items-center justify-center mb-3">
            <div className="w-full h-full bg-white dark:bg-[#151D2C] rounded-[14px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#155EEF] via-[#06B6D4] to-[#7C3AED] flex items-center justify-center">
                <span className="text-white text-xs font-black">N</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('register')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            নিলফা সোশ্যাল কমিউনিটিতে যুক্ত হোন
          </p>
        </div>

        {/* Supabase configuration notice */}
        <SupabaseConfigNotice className="mb-5" />

        {/* Error notification banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('displayName')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="মোহাম্মদ রাফসানুল ইসলাম"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="rafsanul_bd"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {t('usernameHelp')}
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@domain.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#155EEF] focus:ring-[#155EEF] border-slate-300"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                {t('termsAgreement')}
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <span>{t('createAccount')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <span>{t('alreadyHaveAccount')} </span>
          <Link
            to="/login"
            className="font-bold text-[#155EEF] dark:text-[#38BDF8] hover:underline"
          >
            {t('signInNow')}
          </Link>
        </div>
      </div>
    </div>
  );
};
