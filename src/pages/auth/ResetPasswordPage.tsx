import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { SupabaseConfigNotice } from '../../components/auth/SupabaseConfigNotice';

export const ResetPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const { updatePassword, isConfigured } = useAuth();
  const { showToast } = useNotice();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage(t('errorPasswordShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('errorPasswordMismatch'));
      return;
    }

    if (!isConfigured) {
      setErrorMessage(t('supabaseNotConfiguredDesc'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMessage(error.message || t('errorGenericAuth'));
      } else {
        setIsSuccess(true);
        showToast(t('passwordResetSuccess'));
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      }
    } catch {
      setErrorMessage(t('errorGenericAuth'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="rounded-3xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#155EEF] dark:text-[#38BDF8] flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('resetPassword')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            আপনার অ্যাকাউন্টের জন্য একটি নতুন ও সুরক্ষিত পাসওয়ার্ড সেট করুন
          </p>
        </div>

        <SupabaseConfigNotice className="mb-5" />

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="text-base text-slate-900 dark:text-white font-bold mb-1">
              {t('passwordResetSuccess')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              আপনাকে লগইন পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে...
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] text-white"
            >
              লগইনে যান
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন পাসওয়ার্ড
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
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('loading')}</span>
                  </>
                ) : (
                  <span>পাসওয়ার্ড আপডেট করুন</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
