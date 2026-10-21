import React, { useState, useEffect } from 'react';
import { CommentItem } from '../../types';
import { fetchComments, addComment, deleteComment } from '../../services/feedService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotice } from '../../context/NoticeContext';
import { Send, CornerDownRight, Trash2, Loader2, MessageCircle, AlertCircle } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (newCount: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useNotice();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchComments(postId).then(({ comments: fetched, error }) => {
      if (!isMounted) return;
      if (error) {
        setErrorMsg('মন্তব্য লোড করা সম্ভব হয়নি।');
      } else {
        setComments(fetched);
        if (onCommentCountChange) {
          const total = fetched.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
          onCommentCountChange(total);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    if (!user) {
      showToast('মন্তব্য করতে অনুগ্রহ করে সাইন ইন করুন।');
      return;
    }

    setIsSubmitting(true);
    const { comment, error } = await addComment({
      postId,
      authorId: user.id,
      content: newCommentText.trim(),
    });

    if (error || !comment) {
      showToast(error?.message || 'মন্তব্য পাঠাতে ব্যর্থ হয়েছে।');
    } else {
      const updated = [...comments, comment];
      setComments(updated);
      setNewCommentText('');
      showToast('মন্তব্য প্রকাশিত হয়েছে!');
      if (onCommentCountChange) {
        const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
        onCommentCountChange(total);
      }
    }
    setIsSubmitting(false);
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    if (!user) {
      showToast('উত্তর দিতে অনুগ্রহ করে সাইন ইন করুন।');
      return;
    }

    setIsSubmitting(true);
    const { comment, error } = await addComment({
      postId,
      authorId: user.id,
      content: replyText.trim(),
      parentCommentId: parentId,
    });

    if (error || !comment) {
      showToast(error?.message || 'উত্তর পাঠাতে ব্যর্থ হয়েছে।');
    } else {
      const updated = comments.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), comment],
          };
        }
        return c;
      });
      setComments(updated);
      setReplyText('');
      setReplyingTo(null);
      showToast('উত্তর সফলভাবে যুক্ত হয়েছে!');
      if (onCommentCountChange) {
        const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
        onCommentCountChange(total);
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean, parentId?: string) => {
    if (!user) return;
    const { error } = await deleteComment(commentId, user.id);
    if (error) {
      showToast('মন্তব্য মুছে ফেলতে সমস্যা হয়েছে।');
    } else {
      let updated: CommentItem[];
      if (isReply && parentId) {
        updated = comments.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== commentId),
            };
          }
          return c;
        });
      } else {
        updated = comments.filter((c) => c.id !== commentId);
      }
      setComments(updated);
      showToast('মন্তব্য মুছে ফেলা হয়েছে।');
      if (onCommentCountChange) {
        const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
        onCommentCountChange(total);
      }
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
      {/* New comment input */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex gap-2.5 mb-4">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="একটি গঠনমূলক মন্তব্য লিখুন..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">মন্তব্য</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>মন্তব্য করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে সাইন ইন করুন।</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#155EEF]" />
          <span>মন্তব্য লোড হচ্ছে...</span>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comments.length === 0 && (
        <div className="py-6 text-center text-xs text-slate-400">
          <MessageCircle className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
          <p>এখনও কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="group">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {comment.author.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {comment.author.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {comment.author.handle}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {comment.created_at}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                {/* Actions: Reply and Delete */}
                <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-slate-400">
                  {user && (
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo?.id === comment.id
                            ? null
                            : { id: comment.id, name: comment.author.name }
                        )
                      }
                      className="hover:text-[#155EEF] dark:hover:text-[#38BDF8] font-medium"
                    >
                      উত্তর দিন
                    </button>
                  )}
                  {user && user.id === comment.author_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id, false)}
                      className="hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>মুছুন</span>
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyingTo?.id === comment.id && (
                  <form
                    onSubmit={(e) => handleAddReply(e, comment.id)}
                    className="flex gap-2 mt-2 ml-3 animate-in fade-in"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`${comment.author.name}-এর মন্তব্যের উত্তর লিখুন...`}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-[#155EEF]"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSubmitting}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#155EEF] text-white disabled:opacity-50"
                    >
                      পাঠান
                    </button>
                  </form>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {reply.author.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="p-2.5 rounded-xl rounded-tl-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {reply.author.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {reply.created_at}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                          {user && user.id === reply.author_id && (
                            <div className="px-1 pt-0.5">
                              <button
                                onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                              >
                                মুছুন
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
