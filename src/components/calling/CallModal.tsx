/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  SwitchCamera,
  Minimize2,
  Maximize2,
  AlertCircle,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { CallSession, CallMediaState } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCallingProviderConfig } from '../../services/callingService';

interface CallModalProps {
  session: CallSession | null;
  isIncoming: boolean;
  mediaState: CallMediaState;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  error: string | null;
  onDismissError: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  session,
  isIncoming,
  mediaState,
  isMinimized,
  onToggleMinimize,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  error,
  onDismissError,
}) => {
  const { t } = useLanguage();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const providerConfig = getCallingProviderConfig();

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && mediaState.localStream) {
      localVideoRef.current.srcObject = mediaState.localStream;
    }
  }, [mediaState.localStream, mediaState.isVideoOff, isMinimized]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If there's an error and no session
  if (error && !session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white dark:bg-[#151D2C] rounded-2xl p-6 shadow-2xl border border-red-200 dark:border-red-900/50 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            কল শুরু করা যায়নি (Call Failed)
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {error}
          </p>
          <button
            onClick={onDismissError}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-sm transition-colors"
          >
            ঠিক আছে (Close)
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const partner =
    session.participants.find((p) => p.user_id !== session.initiator_id)?.profile ||
    session.initiator;

  const isVideoCall = session.call_type === 'video';

  // 1. Minimized View (Floating Picture-in-Picture bar at bottom right)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-[#0F172A] text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm">
          {partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : 'US'}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-xs font-bold truncate">{partner?.display_name || 'User'}</div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {session.status === 'active' ? formatDuration(mediaState.durationSeconds) : 'Connecting...'}
          </div>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onEnd}
          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Incoming Call Dialog
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm bg-[#0F172A] text-white rounded-3xl p-6 shadow-2xl border border-slate-800 text-center flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center text-3xl font-bold shadow-lg animate-pulse">
              {partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <span className="absolute -bottom-1 -right-1 p-2 rounded-full bg-blue-600 border-2 border-[#0F172A] text-white shadow-xs">
              {isVideoCall ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-1">{partner?.display_name || 'Nilpha Member'}</h3>
          <p className="text-xs text-slate-400 mb-2">@{partner?.username || 'member'}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>
              {isVideoCall ? 'ইনকামিং ভিডিও কল...' : 'ইনকামিং অডিও কল...'}
            </span>
          </div>

          <div className="flex items-center gap-6 w-full justify-center">
            {/* Decline */}
            <button
              onClick={onDecline}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-red-600/30">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">প্রত্যাখ্যান</span>
            </button>

            {/* Accept */}
            <button
              onClick={onAccept}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-emerald-600/30">
                {isVideoCall ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">রিসিভ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fullscreen / Modal Active Call Window
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl h-[92vh] max-h-[720px] bg-[#0B0F19] text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative">
        {/* Top Header Bar */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xs z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#155EEF] to-[#7C3AED] flex items-center justify-center text-sm font-bold shadow-xs">
              {partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : 'NS'}
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{partner?.display_name || 'User'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {isVideoCall ? 'ভিডিও কল' : 'অডিও কল'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                  <Wifi className="w-3 h-3" />
                  {session.status === 'active'
                    ? formatDuration(mediaState.durationSeconds)
                    : session.status === 'ringing'
                    ? 'রিং হচ্ছে...'
                    : 'সংযুক্ত হচ্ছে...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize */}
            <button
              onClick={onToggleMinimize}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Banner: Provider Configuration Info */}
        <div className="bg-blue-950/60 border-b border-blue-900/50 px-4 py-2 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">WebRTC মিডিয়া সেশন:</span>
            <span className="truncate">
              ক্যামেরা ও মাইক্রোফোন সক্রিয়। প্রোডাকশন মাল্টি-পার্টি কলিংয়ের জন্য LiveKit SFU কনফিগারেশন সমর্থিত।
            </span>
          </div>
        </div>

        {/* Main Stage View */}
        <div className="flex-1 relative bg-[#060911] flex items-center justify-center overflow-hidden">
          {isVideoCall ? (
            /* Video Call Screen */
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Remote Participant Placeholder or Stream */}
              <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-900 to-black p-4">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl border-4 border-slate-800">
                    {partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : 'NS'}
                  </div>
                  {session.status === 'active' && (
                    <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0B0F19]" />
                  )}
                </div>

                <h4 className="mt-4 text-base sm:text-lg font-bold text-white">
                  {partner?.display_name || 'User'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {session.status === 'active'
                    ? 'ভিডিও স্ট্রিম সংযুক্ত আছে'
                    : 'কলের উত্তর দেওয়ার অপেক্ষায়...'}
                </p>
              </div>

              {/* Local Video Preview (Picture in Picture) */}
              <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-44 sm:h-56 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 z-20">
                {!mediaState.isVideoOff && mediaState.localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2 text-center">
                    <VideoOff className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-[10px] text-slate-400">ক্যামেরা বন্ধ</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-medium text-white backdrop-blur-xs">
                  আপনি
                </div>
              </div>
            </div>
          ) : (
            /* Audio Call Screen */
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#155EEF] via-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-5xl font-bold shadow-2xl animate-pulse">
                  {partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : 'NS'}
                </div>
                {session.status === 'active' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-blue-500/30 animate-ping pointer-events-none" />
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                {partner?.display_name || 'Nilpha Member'}
              </h3>
              <p className="text-sm text-slate-400 mb-4">@{partner?.username || 'member'}</p>

              <div className="px-4 py-1.5 rounded-full bg-slate-800/80 text-emerald-400 text-sm font-mono font-medium">
                {session.status === 'active' ? formatDuration(mediaState.durationSeconds) : 'রিং হচ্ছে...'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-4 bg-[#0F172A] border-t border-slate-800/90 flex items-center justify-center gap-4 sm:gap-6 z-20">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              mediaState.isMuted
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={mediaState.isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
          >
            {mediaState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          {isVideoCall && (
            <button
              onClick={onToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                mediaState.isVideoOff
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={mediaState.isVideoOff ? 'ক্যামেরা চালু করুন' : 'ক্যামেরা বন্ধ করুন'}
            >
              {mediaState.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Switch Camera */}
          {isVideoCall && !mediaState.isVideoOff && (
            <button
              onClick={onSwitchCamera}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all"
              title="ক্যামেরা পরিবর্তন করুন"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-xl shadow-red-600/40"
            title="কল শেষ করুন"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
