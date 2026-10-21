import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post, CommentItem, PostMediaItem, ReportReason } from '../types';
import { uploadPostMediaFile, getPublicMediaUrl } from './storageService';

// Format timestamp helper
export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'এইমাত্র (just now)';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'পূর্বে';
  }
}

interface FetchFeedParams {
  page?: number;
  limit?: number;
  hashtag?: string;
  currentUserId?: string;
  filter?: 'latest' | 'following';
}

export async function fetchFeedPosts({
  page = 0,
  limit = 10,
  hashtag,
  currentUserId,
  filter = 'latest',
}: FetchFeedParams): Promise<{ posts: Post[]; hasMore: boolean; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      posts: [],
      hasMore: false,
      error: new Error('Supabase is not configured. Please set your credentials in .env'),
    };
  }

  try {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('posts')
      .select(
        `
        id,
        author_id,
        content,
        visibility,
        created_at,
        updated_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        post_media (
          id,
          post_id,
          storage_path,
          media_type,
          mime_type,
          file_size,
          display_order
        ),
        post_likes (
          user_id
        ),
        comments (
          id
        ),
        bookmarks (
          user_id
        )
      `
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    // If hashtag filtering
    if (hashtag) {
      query = query.ilike('content', `%#${hashtag}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { posts: [], hasMore: false, error: new Error(error.message) };
    }

    if (!data) {
      return { posts: [], hasMore: false, error: null };
    }

    const posts: Post[] = data.map((item: any) => {
      const authorProfile = item.author || {};
      const authorName = authorProfile.display_name || 'বেনামী ব্যবহারকারী';
      const authorHandle = authorProfile.username ? `@${authorProfile.username}` : '@user';
      const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'নিল';

      const mediaItems: PostMediaItem[] = (item.post_media || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((m: any) => ({
          ...m,
          url: getPublicMediaUrl(m.storage_path),
        }));

      const likesList = item.post_likes || [];
      const commentsList = item.comments || [];
      const bookmarksList = item.bookmarks || [];

      return {
        id: item.id,
        author_id: item.author_id,
        author: {
          id: authorProfile.id,
          name: authorName,
          handle: authorHandle,
          avatarUrl: authorProfile.avatar_url,
          avatarColor: 'from-[#155EEF] to-[#7C3AED]',
          initials,
        },
        content: item.content,
        visibility: item.visibility,
        created_at: item.created_at,
        updated_at: item.updated_at,
        timestamp: formatTimeAgo(item.created_at),
        likes: likesList.length,
        comments: commentsList.length,
        shares: 0,
        likedByMe: Boolean(currentUserId && likesList.some((l: any) => l.user_id === currentUserId)),
        bookmarkedByMe: Boolean(currentUserId && bookmarksList.some((b: any) => b.user_id === currentUserId)),
        media: mediaItems,
        isDemo: false,
      };
    });

    const hasMore = data.length === limit;
    return { posts, hasMore, error: null };
  } catch (err: any) {
    return { posts: [], hasMore: false, error: err };
  }
}

export async function fetchPostById(
  postId: string,
  currentUserId?: string
): Promise<{ post: Post | null; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { post: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        id,
        author_id,
        content,
        visibility,
        created_at,
        updated_at,
        deleted_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        post_media (
          id,
          post_id,
          storage_path,
          media_type,
          mime_type,
          file_size,
          display_order
        ),
        post_likes (
          user_id
        ),
        comments (
          id
        ),
        bookmarks (
          user_id
        )
      `
      )
      .eq('id', postId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return { post: null, error: new Error(error.message) };
    }

    if (!data) {
      return { post: null, error: new Error('পোস্টটি পাওয়া যায়নি বা মুছে ফেলা হয়েছে।') };
    }

    const authorProfile: any = Array.isArray(data.author) ? data.author[0] : (data.author || {});
    const authorName = authorProfile.display_name || 'বেনামী ব্যবহারকারী';
    const authorHandle = authorProfile.username ? `@${authorProfile.username}` : '@user';
    const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'নিল';

    const mediaItems: PostMediaItem[] = (data.post_media || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((m: any) => ({
        ...m,
        url: getPublicMediaUrl(m.storage_path),
      }));

    const likesList = data.post_likes || [];
    const commentsList = data.comments || [];
    const bookmarksList = data.bookmarks || [];

    const post: Post = {
      id: data.id,
      author_id: data.author_id,
      author: {
        id: authorProfile.id,
        name: authorName,
        handle: authorHandle,
        avatarUrl: authorProfile.avatar_url,
        avatarColor: 'from-[#155EEF] to-[#7C3AED]',
        initials,
      },
      content: data.content,
      visibility: data.visibility,
      created_at: data.created_at,
      updated_at: data.updated_at,
      timestamp: formatTimeAgo(data.created_at),
      likes: likesList.length,
      comments: commentsList.length,
      shares: 0,
      likedByMe: Boolean(currentUserId && likesList.some((l: any) => l.user_id === currentUserId)),
      bookmarkedByMe: Boolean(currentUserId && bookmarksList.some((b: any) => b.user_id === currentUserId)),
      media: mediaItems,
      isDemo: false,
    };

    return { post, error: null };
  } catch (err: any) {
    return { post: null, error: err };
  }
}

interface CreatePostParams {
  authorId: string;
  content: string;
  visibility?: 'public' | 'private';
  files?: File[];
  onUploadProgress?: (percent: number) => void;
}

export async function createPost({
  authorId,
  content,
  visibility = 'public',
  files = [],
  onUploadProgress,
}: CreatePostParams): Promise<{ post: Post | null; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { post: null, error: new Error('Supabase is not configured.') };
  }

  const trimmed = content.trim();
  if (!trimmed && files.length === 0) {
    return { post: null, error: new Error('পোস্টে টেক্সট অথবা মিডিয়া সংযুক্তি আবশ্যক।') };
  }

  if (trimmed.length > 5000) {
    return { post: null, error: new Error('পোস্টের টেক্সট সর্বোচ্চ ৫,০০০ অক্ষরের হতে পারে।') };
  }

  try {
    // 1. Insert post row
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        content: trimmed,
        visibility,
      })
      .select('id, created_at, updated_at')
      .single();

    if (postError) {
      return { post: null, error: new Error(postError.message) };
    }

    const postId = postData.id;
    const mediaItems: PostMediaItem[] = [];

    // 2. Upload media attachments if any
    if (files.length > 0) {
      let completedFiles = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadResult = await uploadPostMediaFile(authorId, file, (pct) => {
          if (onUploadProgress) {
            const overall = ((completedFiles + pct / 100) / files.length) * 100;
            onUploadProgress(Math.round(overall));
          }
        });

        const { data: mediaRow, error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            storage_path: uploadResult.storagePath,
            media_type: uploadResult.mediaType,
            mime_type: uploadResult.mimeType,
            file_size: uploadResult.fileSize,
            display_order: i,
          })
          .select()
          .single();

        if (mediaError) {
          console.error('Failed to link media attachment:', mediaError);
        } else if (mediaRow) {
          mediaItems.push({
            ...mediaRow,
            url: uploadResult.publicUrl,
          });
        }
        completedFiles++;
      }
    }

    // 3. Return fresh complete post
    const { post } = await fetchPostById(postId, authorId);
    return { post, error: null };
  } catch (err: any) {
    return { post: null, error: err };
  }
}

export async function deletePost(postId: string, userId: string): Promise<{ error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('author_id', userId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function togglePostLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    if (currentlyLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, error: null };
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, error: null };
    }
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function toggleBookmark(
  postId: string,
  userId: string,
  currentlyBookmarked: boolean
): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    if (currentlyBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, error: null };
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ post_id: postId, user_id: userId });

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, error: null };
    }
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function fetchComments(
  postId: string
): Promise<{ comments: CommentItem[]; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { comments: [], error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        post_id,
        author_id,
        parent_comment_id,
        content,
        created_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      return { comments: [], error: new Error(error.message) };
    }

    const allComments: CommentItem[] = (data || []).map((c: any) => {
      const author = c.author || {};
      const name = author.display_name || 'বেনামী';
      const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'নিল';
      return {
        id: c.id,
        post_id: c.post_id,
        author_id: c.author_id,
        parent_comment_id: c.parent_comment_id,
        content: c.content,
        created_at: formatTimeAgo(c.created_at),
        author: {
          id: author.id || c.author_id,
          name,
          handle: author.username ? `@${author.username}` : '@user',
          avatarUrl: author.avatar_url,
          initials,
        },
      };
    });

    // Structure flat replies under parent comments
    const topLevel: CommentItem[] = [];
    const replyMap = new Map<string, CommentItem[]>();

    allComments.forEach((c) => {
      if (c.parent_comment_id) {
        const existing = replyMap.get(c.parent_comment_id) || [];
        existing.push(c);
        replyMap.set(c.parent_comment_id, existing);
      } else {
        topLevel.push(c);
      }
    });

    topLevel.forEach((c) => {
      c.replies = replyMap.get(c.id) || [];
    });

    return { comments: topLevel, error: null };
  } catch (err: any) {
    return { comments: [], error: err };
  }
}

export async function addComment({
  postId,
  authorId,
  content,
  parentCommentId,
}: {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}): Promise<{ comment: CommentItem | null; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { comment: null, error: new Error('Supabase is not configured.') };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { comment: null, error: new Error('মন্তব্য খালি রাখা যাবে না।') };
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content: trimmed,
        parent_comment_id: parentCommentId || null,
      })
      .select(
        `
        id,
        post_id,
        author_id,
        parent_comment_id,
        content,
        created_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      return { comment: null, error: new Error(error.message) };
    }

    const author: any = Array.isArray(data.author) ? data.author[0] : (data.author || {});
    const name = author.display_name || 'বেনামী';
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'নিল';

    const commentItem: CommentItem = {
      id: data.id,
      post_id: data.post_id,
      author_id: data.author_id,
      parent_comment_id: data.parent_comment_id,
      content: data.content,
      created_at: formatTimeAgo(data.created_at),
      author: {
        id: author.id || data.author_id,
        name,
        handle: author.username ? `@${author.username}` : '@user',
        avatarUrl: author.avatar_url,
        initials,
      },
      replies: [],
    };

    return { comment: commentItem, error: null };
  } catch (err: any) {
    return { comment: null, error: err };
  }
}

export async function deleteComment(
  commentId: string,
  authorId: string
): Promise<{ error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', authorId);

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchUserBookmarks(
  userId: string
): Promise<{ posts: Post[]; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { posts: [], error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(
        `
        id,
        post_id,
        created_at,
        post:posts (
          id,
          author_id,
          content,
          visibility,
          created_at,
          updated_at,
          deleted_at,
          author:profiles!author_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          post_media (
            id,
            post_id,
            storage_path,
            media_type,
            mime_type,
            file_size,
            display_order
          ),
          post_likes (
            user_id
          ),
          comments (
            id
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { posts: [], error: new Error(error.message) };
    }

    const posts: Post[] = [];
    (data || []).forEach((b: any) => {
      const p = b.post;
      if (!p || p.deleted_at) return;

      const authorProfile = p.author || {};
      const authorName = authorProfile.display_name || 'বেনামী';
      const authorHandle = authorProfile.username ? `@${authorProfile.username}` : '@user';
      const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'নিল';

      const mediaItems: PostMediaItem[] = (p.post_media || [])
        .sort((x: any, y: any) => x.display_order - y.display_order)
        .map((m: any) => ({
          ...m,
          url: getPublicMediaUrl(m.storage_path),
        }));

      posts.push({
        id: p.id,
        author_id: p.author_id,
        author: {
          id: authorProfile.id,
          name: authorName,
          handle: authorHandle,
          avatarUrl: authorProfile.avatar_url,
          avatarColor: 'from-[#155EEF] to-[#7C3AED]',
          initials,
        },
        content: p.content,
        visibility: p.visibility,
        created_at: p.created_at,
        updated_at: p.updated_at,
        timestamp: formatTimeAgo(p.created_at),
        likes: (p.post_likes || []).length,
        comments: (p.comments || []).length,
        shares: 0,
        likedByMe: (p.post_likes || []).some((l: any) => l.user_id === userId),
        bookmarkedByMe: true,
        media: mediaItems,
        isDemo: false,
      });
    });

    return { posts, error: null };
  } catch (err: any) {
    return { posts: [], error: err };
  }
}

export async function submitModerationReport({
  reporterId,
  postId,
  commentId,
  reason,
  details,
}: {
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      post_id: postId || null,
      comment_id: commentId || null,
      reason,
      details: details?.trim() || null,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
