/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security & Input Validation Utilities for Nilpha Social
 * Hardens user inputs, prevents Cross-Site Scripting (XSS), enforces payload bounds,
 * and validates file media types against strict allowlists.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const securityUtils = {
  /**
   * Sanitizes text strings to neutralize HTML entities and strip dangerous executable tags.
   */
  sanitizeText(input: string | null | undefined): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Strips dangerous URI schemes (such as `javascript:`, `data:text/html`, `vbscript:`).
   */
  isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('data:text/html')
    ) {
      return false;
    }
    // Allow relative paths, http, https, and data:image
    return (
      trimmed.startsWith('/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/')
    );
  },

  /**
   * Validates string lengths to prevent buffer / memory exhaustion and spam flood.
   */
  validateLength(
    text: string | null | undefined,
    minLength: number,
    maxLength: number
  ): { isValid: boolean; error?: string } {
    const val = (text || '').trim();
    if (val.length < minLength) {
      return {
        isValid: false,
        error: `কমপক্ষে ${minLength} টি অক্ষর প্রয়োজন। (Minimum ${minLength} characters required)`,
      };
    }
    if (val.length > maxLength) {
      return {
        isValid: false,
        error: `সর্বোচ্চ ${maxLength} টি অক্ষরের মধ্যে সীমাবদ্ধ রাখুন। (Maximum ${maxLength} characters allowed)`,
      };
    }
    return { isValid: true };
  },

  /**
   * Validates file upload MIME type against allowed image and video formats.
   */
  validateFile(
    file: File | { type: string; size: number },
    category: 'image' | 'video' | 'any' = 'any'
  ): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'ফাইল পাওয়া যায়নি।' };
    }

    const type = file.type.toLowerCase();

    if (category === 'image' || (category === 'any' && type.startsWith('image/'))) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(type)) {
        return {
          isValid: false,
          error: 'শুধুমাত্র JPEG, PNG, WEBP বা GIF ফরম্যাটের ছবি আপলোড করা যাবে।',
        };
      }
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        return {
          isValid: false,
          error: 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারে।',
        };
      }
      return { isValid: true };
    }

    if (category === 'video' || (category === 'any' && type.startsWith('video/'))) {
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(type)) {
        return {
          isValid: false,
          error: 'শুধুমাত্র MP4, WebM বা QuickTime ফরম্যাটের ভিডিও গ্রহণযোগ্য।',
        };
      }
      if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
        return {
          isValid: false,
          error: 'ভিডিওর সাইজ সর্বোচ্চ ৫০ মেগাবাইট (50MB) হতে পারে।',
        };
      }
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'অননুমোদিত ফাইল ফরম্যাট। শুধুমাত্র ছবি ও ভিডিও সমর্থিত।',
    };
  },

  /**
   * Lightweight client-side rate limiter for sensitive actions (e.g., login attempts, reports).
   */
  checkRateLimit(actionKey: string, maxAttempts = 5, windowMs = 60000): { isAllowed: boolean; retryAfterSeconds?: number } {
    try {
      const storageKey = `nilpha_rate_limit_${actionKey}`;
      const now = Date.now();
      const raw = localStorage.getItem(storageKey);
      let timestamps: number[] = raw ? JSON.parse(raw) : [];

      // Filter out timestamps outside window
      timestamps = timestamps.filter((ts) => now - ts < windowMs);

      if (timestamps.length >= maxAttempts) {
        const oldest = timestamps[0];
        const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        return { isAllowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
      }

      timestamps.push(now);
      localStorage.setItem(storageKey, JSON.stringify(timestamps));
      return { isAllowed: true };
    } catch {
      return { isAllowed: true };
    }
  },
};

export const sanitizeText = securityUtils.sanitizeText;
export const isSafeUrl = securityUtils.isSafeUrl;

export const validateLength = (
  text: string | null | undefined,
  minLength: number,
  maxLength: number
) => {
  const res = securityUtils.validateLength(text, minLength, maxLength);
  return { ...res, valid: res.isValid };
};

export const validateFile = (
  file: File | { type: string; size: number; name?: string },
  category: 'image' | 'video' | 'any' = 'any'
) => {
  const res = securityUtils.validateFile(file as any, category);
  return { ...res, valid: res.isValid };
};

// In-memory + storage rate limit helper
const memoryRateLimits = new Map<string, number[]>();

export const checkRateLimit = (
  actionKey: string,
  maxAttempts = 5,
  windowMs = 60000
): { allowed: boolean; isAllowed: boolean; retryAfterMs: number; retryAfterSeconds: number } => {
  const now = Date.now();
  let timestamps = memoryRateLimits.get(actionKey) || [];
  timestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0];
    const retryAfterMs = Math.max(1, oldest + windowMs - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    return {
      allowed: false,
      isAllowed: false,
      retryAfterMs,
      retryAfterSeconds,
    };
  }

  timestamps.push(now);
  memoryRateLimits.set(actionKey, timestamps);
  return {
    allowed: true,
    isAllowed: true,
    retryAfterMs: 0,
    retryAfterSeconds: 0,
  };
};

