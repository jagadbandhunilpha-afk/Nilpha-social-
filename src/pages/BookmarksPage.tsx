import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2, ArrowLeft, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { fetchUserBookmarks } from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/common/PageHeader';
import { PostCard } from '../components/home/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { SupabaseConfigNotice } from '../components/auth/SupabaseConfigNotice';

export const BookmarksPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const { t } = useLanguage();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchUserBookmarks(user.id).then(({ posts: fetched, error }) => {
      if (!isMounted) return;
      if (error) {
        setErrorMsg('সংরক্ষিত পোস্ট লোড করা যায়নি।');
      } else {
        setPosts(fetched);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="সংরক্ষিত পোস্টসমূহ (Bookmarks)"
        subtitle="আপনার পছন্দের ও পরবর্তীতে পড়ার জন্য সেভ করা পোস্টগুলো এখানে থাকবে।"
        kicker="বুকমার্কস"
      />

      {!isConfigured && <SupabaseConfigNotice className="mb-5" />}

      {!user ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            বুকমার্ক দেখতে লগইন করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            আপনার নিজস্ব সংরক্ষিত পোস্টগুলো সুরক্ষিত রাখতে অ্যাকাউন্টে প্রবেশ করা প্রয়োজন।
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] text-white hover:bg-[#1048C6]"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন করুন</span>
          </Link>
        </div>
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#155EEF]" />
          <span className="text-sm font-medium">সংরক্ষিত পোস্ট লোড হচ্ছে...</span>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="কোনো সংরক্ষিত পোস্ট নেই"
          description="ফিডের যেকোনো পোস্টের নিচে বুকমার্ক আইকনে ক্লিক করে এখানে জমা রাখুন।"
          icon={<Bookmark className="w-8 h-8" />}
        />
      )}
    </div>
  );
};
