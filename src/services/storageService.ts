import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const MEDIA_LIMITS = {
  MAX_ATTACHMENTS: 5,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export interface FileValidationError {
  file: File;
  error: string;
}

export function validateMediaFiles(
  newFiles: File[],
  existingCount: number
): { valid: File[]; errors: FileValidationError[] } {
  const valid: File[] = [];
  const errors: FileValidationError[] = [];

  if (existingCount + newFiles.length > MEDIA_LIMITS.MAX_ATTACHMENTS) {
    errors.push({
      file: newFiles[0] || new File([], 'limit'),
      error: `সর্বোচ্চ ${MEDIA_LIMITS.MAX_ATTACHMENTS}টি ফাইল একসাথে যুক্ত করা যাবে (Maximum ${MEDIA_LIMITS.MAX_ATTACHMENTS} files allowed).`,
    });
    return { valid, errors };
  }

  for (const file of newFiles) {
    const isImage = MEDIA_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = MEDIA_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      errors.push({
        file,
        error: `অননুমোদিত ফরম্যাট: ${file.name}। শুধুমাত্র JPG, PNG, WEBP, GIF ও MP4 গ্রহণযোগ্য।`,
      });
      continue;
    }

    if (isImage && file.size > MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      errors.push({
        file,
        error: `ছবি ${file.name} আকারে ১০MB এর বেশি হতে পারবে না।`,
      });
      continue;
    }

    if (isVideo && file.size > MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES) {
      errors.push({
        file,
        error: `ভিডিও ${file.name} আকারে ৫০MB এর বেশি হতে পারবে না।`,
      });
      continue;
    }

    valid.push(file);
  }

  return { valid, errors };
}

export interface UploadResult {
  storagePath: string;
  mediaType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  publicUrl: string;
}

export async function uploadPostMediaFile(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase Storage is not configured.');
  }

  const isVideo = MEDIA_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type);
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

  // Extract clean extension
  const extension = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Scoped path to satisfy Supabase storage RLS: (storage.foldername(name))[1] = auth.uid()
  const storagePath = `${userId}/${uniqueId}.${extension}`;

  if (onProgress) onProgress(30);

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  if (onProgress) onProgress(90);

  // Retrieve public URL
  const { data: urlData } = supabase.storage
    .from('post-media')
    .getPublicUrl(data.path);

  if (onProgress) onProgress(100);

  return {
    storagePath: data.path,
    mediaType,
    mimeType: file.type,
    fileSize: file.size,
    publicUrl: urlData.publicUrl,
  };
}

export function getPublicMediaUrl(storagePath: string): string {
  if (!supabase || !isSupabaseConfigured) {
    return storagePath;
  }
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  const { data } = supabase.storage.from('post-media').getPublicUrl(storagePath);
  return data.publicUrl;
}
