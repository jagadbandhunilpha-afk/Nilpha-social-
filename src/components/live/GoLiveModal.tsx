/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Globe,
  Users,
  Lock,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LiveStreamVisibility } from '../../types';
import { liveStreamingService } from '../../services/liveStreamingService';

interface GoLiveModalProps {
  hostId: string;
  hostProfile?: any;
  onClose: () => void;
  onStreamCreated: (streamId: string) => void;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({
  hostId,
  hostProfile,
  onClose,
  onStreamCreated,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<LiveStreamVisibility>('public');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [starting, setStarting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera and microphone preview in the studio
  useEffect(() => {
    let mounted = true;
    async function startPreview() {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          if (mounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err: any) {
        if (mounted) {
          setPermissionError(
            'ক্যামেরা বা মাইক্রোফোন অ্যাক্সেস করতে ব্রাউজার পারমিশন দিন।'
          );
        }
      }
    }

    startPreview();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
  };

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setStarting(true);
    try {
      const stream = await liveStreamingService.createLiveStream({
        hostId,
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        hostProfile,
      });

      onStreamCreated(stream.id);
      onClose();
    } catch (err) {
      console.error('Failed to create stream:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#151D2C] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              লাইভ ব্রডকাস্ট স্টুডিও (Go Live)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleStartBroadcast} className="p-6 overflow-y-auto space-y-5">
          {/* Camera Preview Area */}
          <div className="w-full h-48 sm:h-56 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center shadow-inner">
            {isCameraOn && !permissionError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-4">
                <VideoOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  {permissionError || 'ক্যামেরা বন্ধ করা হয়েছে'}
                </p>
              </div>
            )}

            {/* In-preview control pill */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-xs p-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-colors ${
                  isMicOn ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                }`}
                title={isMicOn ? 'মাইক্রোফোন চালু' : 'মাইক্রোফোন বন্ধ'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2 rounded-lg transition-colors ${
                  isCameraOn ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                }`}
                title={isCameraOn ? 'ক্যামেরা চালু' : 'ক্যামেরা বন্ধ'}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase">
              লাইভ প্রিভিউ
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              লাইভ স্ট্রিমের শিরোনাম *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: আজকের বিশেষ টেক আড্ডা ও প্রশ্নোত্তর..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="দর্শকদের জন্য স্ট্রিম সম্পর্কে সংক্ষেপে লিখুন..."
              className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] resize-none"
            />
          </div>

          {/* Visibility options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              কাদের জন্য উন্মুক্ত?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  visibility === 'public'
                    ? 'border-[#155EEF] bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">পাবলিক</div>
                <div className="text-[10px] opacity-75">সবার জন্য</div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('followers_only')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  visibility === 'followers_only'
                    ? 'border-[#155EEF] bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">অনুসারী</div>
                <div className="text-[10px] opacity-75">ফলোয়ার্স অনলি</div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  visibility === 'private'
                    ? 'border-[#155EEF] bg-blue-50 dark:bg-blue-900/30 text-[#155EEF] dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Lock className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">ব্যক্তিগত</div>
                <div className="text-[10px] opacity-75">শুধুমাত্র আমি</div>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={starting || !title.trim()}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className="w-5 h-5 animate-pulse" />
              )}
              <span>সরাসরি লাইভ শুরু করুন (Go Live Now)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
