/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  Users,
  Eye,
  Plus,
  Tv,
  Sparkles,
  Calendar,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { GoLiveModal } from '../components/live/GoLiveModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { liveStreamingService } from '../services/liveStreamingService';
import { LiveStream } from '../types';

export const LiveStreamPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'live' | 'all'>('live');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const data = await liveStreamingService.getLiveStreams(activeTab);
      setStreams(data);
    } catch (err) {
      console.warn('Could not load streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader
        title="লাইভ স্ট্রিমিং ও ব্রডকাস্ট"
        subtitle="সরাসরি সম্প্রচার দেখুন অথবা নিজের অডিয়েন্সের সাথে যুক্ত হন"
        kicker="রিয়েল-টাইম সম্প্রচার"
        action={
          <button
            onClick={() => setShowGoLiveModal(true)}
            className="min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 shadow-md shadow-red-600/30 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>লাইভ শুরু করুন (Go Live)</span>
          </button>
        }
      />

      {/* Provider Architecture Guidance Box */}
      <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#155EEF] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">
            লাইভ ব্রডকাস্ট আর্কিটেকচার (Part 5):
          </span>{' '}
          লাইভ স্টুডিওতে ওয়েব ব্রাউজারের ফুল মিডিয়া ডিভাইস ও রিয়েল-টাইম কমেন্ট ইন্টিগ্রেশন কাজ করছে।
          উচ্চ মাত্রার হাজার হাজার দর্শকের জন্য ক্লাউড RTMP/HLS বা LiveKit Ingress স্ট্রিমিং ব্যাকএন্ড
          কনফিগারেশন সংযোগযোগ্য রাখা হয়েছে।
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'live'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span>বর্তমানে লাইভ আছে ({streams.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-[#155EEF] text-[#155EEF] dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>সাম্প্রতিক সম্প্রচারসমূহ</span>
        </button>
      </div>

      {/* Streams Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#155EEF]" />
          <span>লাইভ স্ট্রিম লোড হচ্ছে...</span>
        </div>
      ) : streams.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <Radio className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            বর্তমানে কোনো সক্রিয় লাইভ নেই
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            প্রথম ব্যক্তি হিসেবে আপনার কমিউনিটির জন্য সরাসরি ভিডিও ব্রডকাস্ট শুরু করুন।
          </p>
          <button
            onClick={() => setShowGoLiveModal(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            + নিজের লাইভ শুরু করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map((stream) => {
            const isLive = stream.status === 'live';
            return (
              <div
                key={stream.id}
                onClick={() => navigate(`/live/${stream.id}`)}
                className="group bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Thumbnail / Screen Preview */}
                <div className="w-full h-44 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-slate-800 to-black opacity-80" />
                  <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Radio className="w-8 h-8" />
                  </div>

                  {/* Live Badge */}
                  {isLive ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[10px] font-medium">
                      শেষ হয়েছে
                    </div>
                  )}

                  {/* Viewer Count */}
                  {isLive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{stream.viewer_count}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#155EEF] transition-colors mb-2">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {stream.description}
                      </p>
                    )}
                  </div>

                  {/* Host Row */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {stream.host?.display_name ? stream.host.display_name.slice(0, 2).toUpperCase() : 'H'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                        <span>{stream.host?.display_name || 'Broadcaster'}</span>
                        {stream.host?.verification_status === 'verified' && (
                          <CheckCircle2 className="w-3 h-3 text-[#155EEF] shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @{stream.host?.username || 'user'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Go Live Modal */}
      {showGoLiveModal && (
        <GoLiveModal
          hostId={user?.id || 'user-me'}
          hostProfile={profile}
          onClose={() => setShowGoLiveModal(false)}
          onStreamCreated={(streamId) => {
            navigate(`/live/${streamId}`);
          }}
        />
      )}
    </div>
  );
};
