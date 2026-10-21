import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Flag,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { togglePostLike, toggleBookmark, deletePost } from '../../services/feedService';
import { MediaRenderer } from '../feed/MediaRenderer';
import { CommentSection } from '../feed/CommentSection';
import { ReportDialog } from '../feed/ReportDialog';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onHashtagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onHashtagClick,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useNotice();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(post.bookmarkedByMe || false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = Boolean(user && post.author_id && user.id === post.author_id);

  const handleLike = async () => {
    if (!user) {
      showToast('পছন্দ (Like) করতে অনুগ্রহ করে সাইন ইন করুন।');
      return;
    }

    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Optimistic update
    setLiked(nextLiked);
    setLikeCount(nextCount);

    const { success, error } = await togglePostLike(post.id, user.id, liked);
    if (error || !success) {
      // Rollback on failure
      setLiked(liked);
      setLikeCount(likeCount);
      showToast('লাইক আপডেট করা যায়নি।');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      showToast('সংরক্ষণ (Bookmark) করতে অনুগ্রহ করে সাইন ইন করুন।');
      return;
    }

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    const { success, error } = await toggleBookmark(post.id, user.id, bookmarked);
    if (error || !success) {
      setBookmarked(bookmarked);
      showToast('বুকমার্ক পরিবর্তন করা যায়নি।');
    } else {
      showToast(
        nextBookmarked
          ? 'পোস্টটি বুকমার্কে সংরক্ষিত হয়েছে!'
          : 'পোস্টটি বুকমার্ক থেকে সরানো হয়েছে।'
      );
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nilpha Social - ${post.author.name}`,
          text: post.content.slice(0, 100),
          url: postUrl,
        });
        showToast('শেয়ার সম্পন্ন হয়েছে!');
        return;
      } catch {
        // Fallback to clipboard on cancel or fail
      }
    }

    try {
      await navigator.clipboard.writeText(postUrl);
      showToast('পোস্টের লিংক কপি করা হয়েছে!');
    } catch {
      showToast(postUrl);
    }
  };

  const handleDelete = async () => {
    if (!user || !isAuthor) return;
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই পোস্টটি মুছে ফেলতে চান?')) return;

    setIsDeleting(true);
    const { error } = await deletePost(post.id, user.id);
    if (error) {
      showToast('পোস্ট মুছে ফেলতে সমস্যা হয়েছে।');
      setIsDeleting(false);
    } else {
      showToast('পোস্ট সফলভাবে মুছে ফেলা হয়েছে।');
      if (onPostDeleted) onPostDeleted(post.id);
    }
  };

  // Helper to render text with clickable hashtags
  const renderContentWithHashtags = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_\u0980-\u09FF]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button
            key={i}
            onClick={() => onHashtagClick ? onHashtagClick(tag) : navigate(`/?tag=${encodeURIComponent(tag)}`)}
            className="text-[#155EEF] dark:text-[#38BDF8] hover:underline font-semibold cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <article className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs mb-4 transition-all">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
              post.author.avatarColor || 'from-[#155EEF] to-[#7C3AED]'
            } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              post.author.initials
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {post.author.name}
              </h4>
            </div>
            {/* Zero-Pill unboxed metadata */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{post.author.handle}</span>
              <span aria-hidden="true">·</span>
              <Link to={`/posts/${post.id}`} className="hover:underline">
                {post.timestamp}
              </Link>
              {post.visibility && (
                <>
                  <span aria-hidden="true">·</span>
                  <span title={post.visibility === 'public' ? 'সবার জন্য উন্মুক্ত' : 'ব্যক্তিগত'}>
                    {post.visibility === 'public' ? (
                      <Globe className="w-3 h-3 inline text-slate-400" />
                    ) : (
                      <Lock className="w-3 h-3 inline text-slate-400" />
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-30 text-xs">
                <Link
                  to={`/posts/${post.id}`}
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>পোস্ট বিস্তারিত</span>
                </Link>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>লিংক কপি করুন</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsReportOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600 dark:text-red-400"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>রিপোর্ট করুন</span>
                </button>

                {isAuthor && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'পোস্ট মুছুন'}</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Text Content with Hashtag links */}
      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap mb-2">
        {renderContentWithHashtags(post.content)}
      </p>

      {/* Real Supabase Media Attachments Renderer */}
      {post.media && post.media.length > 0 && <MediaRenderer media={post.media} />}

      {/* Fallback Part 1 placeholder if present */}
      {!post.media?.length && post.mediaPlaceholder && (
        <div
          className={`rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-3.5 ${post.mediaPlaceholder.color} p-6 sm:p-8 flex flex-col items-center justify-center text-center`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {post.mediaPlaceholder.caption}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            ডেমো মিডিয়া প্লেসহোল্ডার
          </span>
        </div>
      )}

      {/* Interaction Bar: Like, Comment, Share, Bookmark */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`min-h-[40px] px-3 rounded-xl flex items-center gap-1.5 transition-colors font-medium cursor-pointer ${
              liked
                ? 'text-[#DC2626] bg-red-50 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                liked ? 'fill-[#DC2626] text-[#DC2626] scale-110' : ''
              }`}
            />
            <span className="tabular-nums font-mono">{likeCount}</span>
            <span className="hidden sm:inline">{liked ? t('liked') : t('like')}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="min-h-[40px] px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors font-medium cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="tabular-nums font-mono">{commentCount}</span>
            <span className="hidden sm:inline">{t('comment')}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="min-h-[40px] px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors font-medium cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('share')}</span>
          </button>
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          className={`min-h-[40px] px-3 rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
            bookmarked
              ? 'text-[#155EEF] dark:text-[#38BDF8]'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title={bookmarked ? 'সংরক্ষিত' : 'বুকমার্ক করুন'}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          <span className="hidden md:inline text-[11px]">
            {bookmarked ? 'সংরক্ষিত' : 'সংরক্ষণ'}
          </span>
        </button>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentCountChange={(newCount) => setCommentCount(newCount)}
        />
      )}

      {/* Report Modal */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        postId={post.id}
        targetTitle={post.content.slice(0, 40)}
      />
    </article>
  );
};
