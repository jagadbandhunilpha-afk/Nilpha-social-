import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { SupabaseConfigNotice } from '../../components/auth/SupabaseConfigNotice';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { signIn, isConfigured, user } = useAuth();
  const { showToast } = useNotice();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(t('errorInvalidEmail'));
      return;
    }

    if (!password) {
      setErrorMessage(t('errorPasswordShort'));
      return;
    }

    if (!isConfigured) {
      setErrorMessage(t('supabaseNotConfiguredDesc'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage(t('errorInvalidCredentials'));
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage(t('emailVerificationRequiredDesc'));
        } else {
          setErrorMessage(error.message || t('errorGenericAuth'));
        }
      } else {
        showToast(t('loginSuccess'));
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';
        navigate(from, { replace: true });
      }
    } catch {
      setErrorMessage(t('errorGenericAuth'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {t('login')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            নিলফা সোশ্যাল অ্যাকাউন্টে প্রবেশ করুন
          </p>
        </div>

        {/* Configuration notice if Supabase env vars are missing */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
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

          {/* Password input with show/hide control */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#155EEF] dark:text-[#38BDF8] hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <span>{t('login')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <span>{t('dontHaveAccount')} </span>
          <Link
            to="/register"
            className="font-bold text-[#155EEF] dark:text-[#38BDF8] hover:underline"
          >
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
};
