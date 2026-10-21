import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Post } from '../types';
import { fetchPostById } from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PostCard } from '../components/home/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, isConfigured } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    let isMounted = true;
    setIsLoading(true);

    fetchPostById(postId, user?.id).then(({ post: fetched, error }) => {
      if (!isMounted) return;
      if (error || !fetched) {
        setErrorMsg(error?.message || 'পোস্টটি লোড করা সম্ভব হয়নি।');
      } else {
        setPost(fetched);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [postId, user?.id]);

  const handlePostDeleted = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ফিডে ফিরে যান</span>
        </Link>
      </div>

      {!isConfigured && <SupabaseConfigNotice className="mb-5" />}

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#155EEF]" />
          <span className="text-sm font-medium">পোস্ট লোড হচ্ছে...</span>
        </div>
      )}

      {!isLoading && errorMsg && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-red-200 dark:border-red-900/40 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            পোস্টটি পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {errorMsg}
          </p>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#155EEF] text-white hover:bg-[#1048C6]"
          >
            মূল পাতায় ফিরুন
          </Link>
        </div>
      )}

      {!isLoading && post && (
        <div>
          <PostCard
            post={post}
            onPostDeleted={handlePostDeleted}
          />
        </div>
      )}
    </div>
  );
};
