import React, { useState, useEffect } from 'react';
import { X, User, AtSign, Globe, Image, Loader2, Check, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
}) => {
  const { t } = useLanguage();
  const { updateProfile, user } = useAuth();
  const { showToast } = useNotice();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'bn' | 'en'>('bn');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name || '');
      setUsername(currentProfile.username || '');
      setBio(currentProfile.bio || '');
      setPreferredLanguage(currentProfile.preferred_language || 'bn');
      setAvatarUrl(currentProfile.avatar_url || '');
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleAvatarUploadPlaceholder = () => {
    showToast(t('avatarUploadNotice'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMessage('ডিসপ্লে নাম খালি রাখা যাবে না।');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        display_name: trimmedName,
        bio: bio.trim(),
        preferred_language: preferredLanguage,
        avatar_url: avatarUrl.trim() || null,
      });

      if (error) {
        setErrorMessage(error.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
      } else {
        showToast(t('profileUpdatedSuccess'));
        onClose();
      }
    } catch {
      setErrorMessage('প্রোফাইল আপডেট সম্পন্ন করা যায়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {t('editProfile')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          আপনার পাবলিক পরিচিতি ও পছন্দসমূহ পরিবর্তন করুন
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
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
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
              />
            </div>
          </div>

          {/* Username (read-only for security / primary handle) */}
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
                disabled
                value={username}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ইউজারনেম ডাটাবেজে স্থায়ীভাবে নিবন্ধিত।
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('bio')}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="আপনার সম্পর্কে কিছু লিখুন..."
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] resize-none"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('preferredLanguage')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferredLanguage('bn')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  preferredLanguage === 'bn'
                    ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/40 text-[#155EEF] dark:text-[#38BDF8]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                বাংলা (BN)
              </button>
              <button
                type="button"
                onClick={() => setPreferredLanguage('en')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  preferredLanguage === 'en'
                    ? 'border-[#155EEF] bg-blue-50/50 dark:bg-blue-950/40 text-[#155EEF] dark:text-[#38BDF8]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Avatar Upload Placeholder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              প্রোফাইল ছবি (অবতার)
            </label>
            <div
              onClick={handleAvatarUploadPlaceholder}
              className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#155EEF] bg-slate-50 dark:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-[#155EEF]" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  সুপাবেস স্টোরেজ বাকেট কানেক্ট করুন
                </span>
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                কনফিগারেশন নোট
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
