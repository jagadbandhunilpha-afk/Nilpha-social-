import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  Video,
  Send,
  X,
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  Hash,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { createPost } from '../../services/feedService';
import { validateMediaFiles, MEDIA_LIMITS } from '../../services/storageService';
import { Post } from '../../types';

interface PostComposerProps {
  onPostCreated: (post: Post) => void;
}

interface LocalAttachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { t } = useLanguage();
  const { user, profile, isConfigured } = useAuth();
  const { showToast } = useNotice();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'আমার প্রোফাইল';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'নিল';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, forceType?: 'video') => {
    setErrorMessage(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const { valid, errors } = validateMediaFiles(files, attachments.length);

    if (errors.length > 0) {
      setErrorMessage(errors[0].error);
    }

    const newAttachments: LocalAttachment[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleCancelDraft = () => {
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setContent('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('পোস্ট করতে অনুগ্রহ করে লগইন করুন।');
      return;
    }

    if (!content.trim() && attachments.length === 0) {
      setErrorMessage('অনুগ্রহ করে কিছু লিখুন অথবা মিডিয়া যুক্ত করুন।');
      return;
    }

    setIsSubmitting(true);
    setUploadPercent(0);

    try {
      const filesToUpload = attachments.map((a) => a.file);
      const { post, error } = await createPost({
        authorId: user.id,
        content: content.trim(),
        visibility,
        files: filesToUpload,
        onUploadProgress: (pct) => setUploadPercent(pct),
      });

      if (error || !post) {
        setErrorMessage(error?.message || 'পোস্ট প্রকাশ করতে সমস্যা হয়েছে।');
      } else {
        handleCancelDraft();
        showToast('পোস্ট সফলভাবে প্রকাশিত হয়েছে!');
        onPostCreated(post);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'পোস্ট প্রকাশ সম্পন্ন করা যায়নি।');
    } finally {
      setIsSubmitting(false);
      setUploadPercent(0);
    }
  };

  if (!user) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            পোস্ট করতে ও বন্ধুদের সাথে শেয়ার করতে লগইন করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            আপনার অ্যাকাউন্টে সাইন ইন করে ফিডে ছবি, ভিডিও ও ভাবনা প্রকাশ করুন।
          </p>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>লগইন করুন</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs mb-5">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
          {initials}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          {/* Header controls: Visibility selector */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {displayName}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-colors ${
                  visibility === 'public'
                    ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>পাবলিক</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-colors ${
                  visibility === 'private'
                    ? 'bg-white dark:bg-slate-700 text-[#155EEF] dark:text-[#38BDF8] shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>ব্যক্তিগত</span>
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={content.length > 60 || attachments.length > 0 ? 3 : 2}
            placeholder={t('composerPlaceholder')}
            className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 focus:border-[#155EEF] dark:focus:border-blue-500 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden transition-all resize-none"
          />

          {/* Error Message */}
          {errorMessage && (
            <div className="my-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black/80 group"
                >
                  {att.type === 'video' ? (
                    <video
                      src={att.previewUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={att.previewUrl}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                    aria-label="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar during upload */}
          {isSubmitting && uploadPercent > 0 && (
            <div className="my-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>আপলোড হচ্ছে...</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#155EEF] transition-all duration-150"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept={MEDIA_LIMITS.ALLOWED_IMAGE_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e)}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept={MEDIA_LIMITS.ALLOWED_VIDEO_TYPES.join(',')}
              className="hidden"
              onChange={(e) => handleFileChange(e, 'video')}
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= MEDIA_LIMITS.MAX_ATTACHMENTS}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#155EEF] dark:hover:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-40"
              >
                <Image className="w-4 h-4 text-emerald-500" />
                <span>ছবি ({attachments.filter(a => a.type === 'image').length})</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={attachments.length >= MEDIA_LIMITS.MAX_ATTACHMENTS || attachments.some(a => a.type === 'video')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#155EEF] dark:hover:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-40"
              >
                <Video className="w-4 h-4 text-[#06B6D4]" />
                <span>ভিডিও</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(content.trim() || attachments.length > 0) && (
                <button
                  type="button"
                  onClick={handleCancelDraft}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  বাতিল
                </button>
              )}

              <button
                type="submit"
                disabled={(!content.trim() && attachments.length === 0) || isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                  (content.trim() || attachments.length > 0) && !isSubmitting
                    ? 'bg-[#155EEF] hover:bg-[#1048C6] text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>প্রকাশ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('postButton')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
