import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupabaseConfigNotice } from '../../components/auth/SupabaseConfigNotice';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const { resetPasswordForEmail, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(t('errorInvalidEmail'));
      return;
    }

    if (!isConfigured) {
      setErrorMessage(t('supabaseNotConfiguredDesc'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMessage(error.message || t('errorGenericAuth'));
      } else {
        setIsSent(true);
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
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('forgotPassword')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            আপনার অ্যাকাউন্টের নিবন্ধিত ইমেইল ঠিকানা দিন
          </p>
        </div>

        <SupabaseConfigNotice className="mb-5" />

        {isSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold mb-2">
              {t('passwordResetSent')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              আপনার ইমেইলের ইনবক্স অথবা স্প্যাম ফোল্ডার পরীক্ষা করে পাসওয়ার্ড রিসেট লিংকে প্রবেশ করুন।
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('backToLogin')}</span>
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

              <button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('loading')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>নির্দেশাবলী পাঠান</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('backToLogin')}</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
