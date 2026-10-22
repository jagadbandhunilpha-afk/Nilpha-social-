/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  Eye,
  Send,
  Heart,
  Flame,
  ThumbsUp,
  Smile,
  Shield,
  Trash2,
  Pin,
  Flag,
  ArrowLeft,
  CheckCircle2,
  PhoneOff,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import { liveStreamingService } from '../services/liveStreamingService';
import { LiveStream, LiveStreamComment, SocialUser } from '../types';

export const LiveWatchPage: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useNotice();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState<LiveStreamComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [endingStream, setEndingStream] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const hostVideoRef = useRef<HTMLVideoElement | null>(null);
  const hostMediaStreamRef = useRef<MediaStream | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = user?.id || 'user-me';
  const currentUserProfile: SocialUser = {
    id: currentUserId,
    username: profile?.username || 'me',
    display_name: profile?.display_name || 'You',
    avatar_url: profile?.avatar_url || null,
  };

  const isHost = stream ? stream.host_id === currentUserId : false;

  useEffect(() => {
    let isMounted = true;
    async function initStream() {
      if (!streamId) return;
      setLoading(true);
      try {
        const data = await liveStreamingService.getLiveStreamById(streamId);
        if (isMounted) {
          setStream(data);
          if (data) {
            const initialComments = await liveStreamingService.getComments(streamId);
            setComments(initialComments);
          }
        }
      } catch (err) {
        console.warn('Could not load stream details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initStream();

    // If host, start camera broadcast stream
    if (streamId) {
      navigator.mediaDevices?.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      }).then((mediaStream) => {
        if (isMounted) {
          hostMediaStreamRef.current = mediaStream;
          if (hostVideoRef.current) {
            hostVideoRef.current.srcObject = mediaStream;
          }
        }
      }).catch((err) => {
        console.warn('Broadcaster media access error:', err);
      });
    }

    return () => {
      isMounted = false;
      if (hostMediaStreamRef.current) {
        hostMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [streamId]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !streamId) return;

    setSendingComment(true);
    try {
      const added = await liveStreamingService.sendComment(
        streamId,
        currentUserId,
        newComment.trim(),
        currentUserProfile
      );
      setComments((prev) => [...prev, added]);
      setNewComment('');
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleTriggerReaction = (emoji: string) => {
    const reactionId = `react-${Date.now()}-${Math.random()}`;
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setFloatingReactions((prev) => [...prev, { id: reactionId, emoji, left }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 2000);
  };

  const handleEndStream = async () => {
    if (!streamId) return;
    setEndingStream(true);
    try {
      await liveStreamingService.endLiveStream(streamId, currentUserId);
      if (stream) {
        setStream({ ...stream, status: 'ended', ended_at: new Date().toISOString() });
      }
      showToast('লাইভ সম্প্রচার সফলভাবে সমাপ্ত হয়েছে');
    } catch (err) {
      console.error('Failed to end stream:', err);
    } finally {
      setEndingStream(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!streamId) return;
    await liveStreamingService.deleteComment(commentId, streamId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    showToast('মন্তব্যটি মুছে ফেলা হয়েছে');
  };

  const handleTogglePinComment = async (comment: LiveStreamComment) => {
    if (!streamId) return;
    await liveStreamingService.togglePinComment(comment.id, streamId, comment.is_pinned);
    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, is_pinned: !c.is_pinned } : c))
    );
    showToast(comment.is_pinned ? 'পিন সরানো হয়েছে' : 'মন্তব্য পিন করা হয়েছে');
  };

  const handleBlockViewer = async (targetUserId: string) => {
    if (!streamId) return;
    await liveStreamingService.moderateViewer(
      streamId,
      currentUserId,
      targetUserId,
      'block_viewer',
      'Abusive behavior in live chat'
    );
    showToast('ব্যবহারকারীকে এই লাইভ চ্যাট থেকে ব্লক করা হয়েছে');
  };

  const handleReportStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamId || !reportReason) return;
    await liveStreamingService.moderateViewer(
      streamId,
      currentUserId,
      stream?.host_id || 'unknown',
      'report',
      reportReason
    );
    setShowReportModal(false);
    showToast('আপনার রিপোর্ট পর্যালোচনা দলের কাছে পাঠানো হয়েছে। ধন্যবাদ!');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-red-600" />
        <span>লাইভ স্ট্রিম সংযোগ করা হচ্ছে...</span>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          লাইভ স্ট্রিম খুঁজে পাওয়া যায়নি
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          সম্ভবত এই সম্প্রচারটি মুছে ফেলা হয়েছে অথবা লিঙ্কটি সঠিক নয়।
        </p>
        <Link
          to="/live"
          className="px-4 py-2 rounded-xl bg-[#155EEF] text-white text-xs font-semibold"
        >
          লাইভ তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const isLive = stream.status === 'live';

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল লাইভ স্ট্রিমে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-3">
          {!isHost && isLive && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>রিপোর্ট করুন</span>
            </button>
          )}

          {isHost && isLive && (
            <button
              onClick={handleEndStream}
              disabled={endingStream}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{endingStream ? 'শেষ করা হচ্ছে...' : 'লাইভ সমাপ্ত করুন (End Stream)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio / Viewing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Video Stage & Stream Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Container */}
          <div className="w-full h-[52vh] min-h-[360px] max-h-[500px] bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl flex items-center justify-center">
            {isLive ? (
              <>
                {/* Real Camera Preview for Host / Broadcaster */}
                <video
                  ref={hostVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Floating Elements on Video */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 text-white text-xs font-bold tracking-wider uppercase shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>LIVE</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/60 text-white text-xs font-medium backdrop-blur-xs">
                    <Eye className="w-4 h-4" />
                    <span>{stream.viewer_count} দর্শক</span>
                  </div>
                </div>

                {/* Floating Reaction Animations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                  {floatingReactions.map((r) => (
                    <div
                      key={r.id}
                      style={{ left: `${r.left}%` }}
                      className="absolute bottom-6 text-3xl animate-bounce transition-all duration-1000"
                    >
                      {r.emoji}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Ended State Screen */
              <div className="text-center p-8 z-10 text-white">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Radio className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">এই লাইভ সম্প্রচারটি সমাপ্ত হয়েছে</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  সম্প্রচারে যুক্ত থাকার জন্য সবাইকে ধন্যবাদ। নতুন লাইভ শুরু হলে নোটিফিকেশন পেতে হোস্টকে ফলো করুন।
                </p>
                <Link
                  to="/live"
                  className="px-5 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold inline-block"
                >
                  অন্যান্য লাইভ দেখুন
                </Link>
              </div>
            )}
          </div>

          {/* Stream Information Card */}
          <div className="p-5 bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              {stream.title}
            </h1>

            {stream.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">
                {stream.description}
              </p>
            )}

            {/* Host Row */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {stream.host?.display_name ? stream.host.display_name.slice(0, 2).toUpperCase() : 'H'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{stream.host?.display_name || 'Broadcaster'}</span>
                    {stream.host?.verification_status === 'verified' && (
                      <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    @{stream.host?.username || 'host'}
                  </div>
                </div>
              </div>

              {!isHost && (
                <button
                  onClick={() => showToast('হোস্টকে ফলো করা হয়েছে!')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors"
                >
                  ফলো করুন
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Real-time Live Comments & Reactions */}
        <div className="h-[65vh] min-h-[480px] bg-white dark:bg-[#151D2C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                সরাসরি লাইভ কমেন্ট ({comments.length})
              </h3>
            </div>
            {isHost && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#155EEF] dark:text-blue-300 font-bold">
                হোস্ট মোড
              </span>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                <Smile className="w-8 h-8 mb-2 opacity-50" />
                <span>প্রথম মন্তব্যটি আপনি করুন!</span>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-2.5 rounded-xl text-xs transition-colors group ${
                    comment.is_pinned
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {comment.user?.display_name || 'দর্শক'}
                      </span>
                      {comment.is_pinned && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          <Pin className="w-2.5 h-2.5" />
                          পিন করা
                        </span>
                      )}
                    </div>

                    {/* Host Moderation Controls */}
                    {isHost && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePinComment(comment)}
                          className="p-1 rounded text-slate-400 hover:text-amber-500"
                          title="পিন করুন"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                          title="মন্তব্য মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleBlockViewer(comment.user_id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600"
                          title="দর্শককে ব্লক করুন"
                        >
                          <Shield className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Quick Emoji Reaction Buttons */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around bg-slate-50/70 dark:bg-slate-900/30">
            <button
              onClick={() => handleTriggerReaction('❤️')}
              className="text-xl hover:scale-130 transition-transform cursor-pointer"
              title="ভালোবাসা"
            >
              ❤️
            </button>
            <button
              onClick={() => handleTriggerReaction('🔥')}
              className="text-xl hover:scale-130 transition-transform cursor-pointer"
              title="আগুন"
            >
              🔥
            </button>
            <button
              onClick={() => handleTriggerReaction('👏')}
              className="text-xl hover:scale-130 transition-transform cursor-pointer"
              title="তালি"
            >
              👏
            </button>
            <button
              onClick={() => handleTriggerReaction('🎉')}
              className="text-xl hover:scale-130 transition-transform cursor-pointer"
              title="উদযাপন"
            >
              🎉
            </button>
            <button
              onClick={() => handleTriggerReaction('🙏')}
              className="text-xl hover:scale-130 transition-transform cursor-pointer"
              title="ধন্যবাদ"
            >
              🙏
            </button>
          </div>

          {/* Comment Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2C]">
            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                disabled={!isLive}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isLive ? 'সরাসরি মন্তব্য লিখুন...' : 'লাইভ শেষ হয়েছে'}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] border border-transparent"
              />
              <button
                type="submit"
                disabled={!isLive || sendingComment || !newComment.trim()}
                className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 transition-colors shrink-0"
              >
                {sendingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Report Stream Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#151D2C] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              এই লাইভ ব্রডকাস্ট রিপোর্ট করুন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              অনুগ্রহ করে কারণ উল্লেখ করুন যাতে আমাদের মডারেশন টিম যাচাই করতে পারে।
            </p>
            <form onSubmit={handleReportStream} className="space-y-4">
              <select
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="">কারণ নির্বাচন করুন...</option>
                <option value="inappropriate_content">অনুপযুক্ত বা আপত্তিকর বিষয়বস্তু</option>
                <option value="harassment">হয়রানি বা ঘৃণামূলক বক্তব্য</option>
                <option value="copyright">কপিরাইট লঙ্ঘন</option>
                <option value="spam">স্প্যাম বা বিভ্রান্তিকর প্রচার</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!reportReason}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white disabled:opacity-50"
                >
                  রিপোর্ট পাঠান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
