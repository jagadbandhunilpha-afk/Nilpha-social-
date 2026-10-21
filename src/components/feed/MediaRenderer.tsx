import React, { useState } from 'react';
import { PostMediaItem } from '../../types';
import { Play, Volume2, VolumeX, X, Maximize2, AlertCircle, Sparkles } from 'lucide-react';

interface MediaRendererProps {
  media: PostMediaItem[];
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ media }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  if (!media || media.length === 0) return null;

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => new Set(prev).add(url));
  };

  const images = media.filter((m) => m.media_type === 'image');
  const videos = media.filter((m) => m.media_type === 'video');

  return (
    <div className="mt-3 mb-3.5 space-y-2">
      {/* Videos Section */}
      {videos.map((vid) => (
        <div
          key={vid.id}
          className="rounded-2xl overflow-hidden bg-black/90 relative aspect-video border border-slate-200 dark:border-slate-800"
        >
          <video
            src={vid.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।
          </video>
        </div>
      ))}

      {/* Images Section with Adaptive Grid Layout */}
      {images.length > 0 && (
        <div
          className={`grid gap-1.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ${
            images.length === 1
              ? 'grid-cols-1 max-h-[500px]'
              : images.length === 2
              ? 'grid-cols-2 aspect-[16/9]'
              : images.length === 3
              ? 'grid-cols-3 aspect-[16/9]'
              : images.length === 4
              ? 'grid-cols-2 aspect-square'
              : 'grid-cols-3 aspect-square'
          }`}
        >
          {images.map((img, idx) => {
            const isFailed = failedUrls.has(img.url || '');
            const isFirstOfThree = images.length === 3 && idx === 0;

            return (
              <div
                key={img.id}
                onClick={() => !isFailed && setSelectedImage(img.url || null)}
                className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 group cursor-pointer ${
                  isFirstOfThree ? 'col-span-2 row-span-2 aspect-auto' : ''
                } ${images.length === 1 ? 'aspect-auto max-h-[480px]' : ''}`}
              >
                {isFailed ? (
                  <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                    <AlertCircle className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-xs">ছবি লোড করা সম্ভব হয়নি</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={img.url}
                      alt={`Post attachment ${idx + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => handleImageError(img.url || '')}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
