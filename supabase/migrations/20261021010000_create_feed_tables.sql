-- Nilpha Social - Part 3 Database Migration
-- Feed, Posts, Media, Likes, Comments, Bookmarks and Moderation Reports

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

-- Indexes for feed queries
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON public.posts (visibility);

-- Trigger for posts updated_at
DROP TRIGGER IF EXISTS on_posts_updated_at ON public.posts;
CREATE TRIGGER on_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. POST MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS post_media_post_id_idx ON public.post_media (post_id, display_order);

-- 3. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT post_likes_post_user_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON public.post_likes (user_id);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments (post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments (parent_comment_id) WHERE deleted_at IS NULL;

-- Trigger for comments updated_at
DROP TRIGGER IF EXISTS on_comments_updated_at ON public.comments;
CREATE TRIGGER on_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT bookmarks_post_user_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks (user_id, created_at DESC);

-- 6. MODERATION REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'impersonation', 'inappropriate', 'other')),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT report_target_check CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR POSTS
-- SELECT: Active public posts or own posts
DROP POLICY IF EXISTS "Posts are readable based on visibility" ON public.posts;
CREATE POLICY "Posts are readable based on visibility"
    ON public.posts FOR SELECT
    USING (
        deleted_at IS NULL AND (
            visibility = 'public' 
            OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
        )
    );

-- INSERT: Authenticated users can insert posts as themselves
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts"
    ON public.posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

-- UPDATE: Users can update only their own posts
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- DELETE: Users can delete only their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- 9. RLS POLICIES FOR POST MEDIA
-- SELECT: Readable if parent post is readable
DROP POLICY IF EXISTS "Post media is viewable if post is viewable" ON public.post_media;
CREATE POLICY "Post media is viewable if post is viewable"
    ON public.post_media FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p 
            WHERE p.id = post_media.post_id 
            AND p.deleted_at IS NULL 
            AND (p.visibility = 'public' OR p.author_id = auth.uid())
        )
    );

-- INSERT: Authenticated author of the post can attach media
DROP POLICY IF EXISTS "Authors can insert media to their own posts" ON public.post_media;
CREATE POLICY "Authors can insert media to their own posts"
    ON public.post_media FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts p 
            WHERE p.id = post_media.post_id 
            AND p.author_id = auth.uid()
        )
    );

-- DELETE: Authors can delete media of their own posts
DROP POLICY IF EXISTS "Authors can delete media of their own posts" ON public.post_media;
CREATE POLICY "Authors can delete media of their own posts"
    ON public.post_media FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p 
            WHERE p.id = post_media.post_id 
            AND p.author_id = auth.uid()
        )
    );

-- 10. RLS POLICIES FOR LIKES
DROP POLICY IF EXISTS "Likes are publicly readable" ON public.post_likes;
CREATE POLICY "Likes are publicly readable"
    ON public.post_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.post_likes;
CREATE POLICY "Authenticated users can like posts"
    ON public.post_likes FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_likes.post_id
            AND p.deleted_at IS NULL
            AND (p.visibility = 'public' OR p.author_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts"
    ON public.post_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 11. RLS POLICIES FOR COMMENTS
DROP POLICY IF EXISTS "Comments are readable if post is visible" ON public.comments;
CREATE POLICY "Comments are readable if post is visible"
    ON public.comments FOR SELECT
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = comments.post_id
            AND p.deleted_at IS NULL
            AND (p.visibility = 'public' OR p.author_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments"
    ON public.comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = comments.post_id
            AND p.deleted_at IS NULL
            AND (p.visibility = 'public' OR p.author_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- 12. RLS POLICIES FOR BOOKMARKS
DROP POLICY IF EXISTS "Users can only see their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can only see their own bookmarks"
    ON public.bookmarks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks"
    ON public.bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 13. RLS POLICIES FOR REPORTS
DROP POLICY IF EXISTS "Users can insert reports as themselves" ON public.reports;
CREATE POLICY "Users can insert reports as themselves"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can read own submitted reports" ON public.reports;
CREATE POLICY "Users can read own submitted reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

-- 14. STORAGE BUCKET FOR POST MEDIA
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view post media" ON storage.objects;
CREATE POLICY "Public can view post media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'post-media' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'post-media' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
