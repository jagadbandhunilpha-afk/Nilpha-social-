-- Nilpha Social - Part 4 Database Migration
-- Social Relationships (Follows, Friends, Blocks), Groups, Pages, Memberships and Role-Based Permissions

-- ============================================================================
-- 1. FOLLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows RLS Policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow" ON public.follows;
CREATE POLICY "Authenticated users can follow"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);


-- ============================================================================
-- 2. FRIEND REQUESTS AND FRIENDSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT friend_requests_no_self CHECK (sender_id <> receiver_id),
    CONSTRAINT friend_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON public.friend_requests (sender_id);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON public.friend_requests (receiver_id);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Users can view their own friend requests"
    ON public.friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Authenticated users can send friend requests" ON public.friend_requests;
CREATE POLICY "Authenticated users can send friend requests"
    ON public.friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received or sent requests" ON public.friend_requests;
CREATE POLICY "Users can update received or sent requests"
    ON public.friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their friend requests" ON public.friend_requests;
CREATE POLICY "Users can delete their friend requests"
    ON public.friend_requests FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships table (canonical representation: user_a_id < user_b_id)
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT friendships_ordered_pair CHECK (user_a_id < user_b_id),
    CONSTRAINT friendships_unique_pair UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS friendships_user_a_idx ON public.friendships (user_a_id);
CREATE INDEX IF NOT EXISTS friendships_user_b_idx ON public.friendships (user_b_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Friendships are viewable by everyone" ON public.friendships;
CREATE POLICY "Friendships are viewable by everyone"
    ON public.friendships FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can manage friendships they participate in" ON public.friendships;
CREATE POLICY "Users can manage friendships they participate in"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);


-- ============================================================================
-- 3. USER BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT user_blocks_no_self CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see whom they have blocked" ON public.user_blocks;
CREATE POLICY "Users can see whom they have blocked"
    ON public.user_blocks FOR SELECT
    USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block other accounts" ON public.user_blocks;
CREATE POLICY "Users can block other accounts"
    ON public.user_blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock accounts" ON public.user_blocks;
CREATE POLICY "Users can unblock accounts"
    ON public.user_blocks FOR DELETE
    USING (auth.uid() = blocker_id);


-- ============================================================================
-- 4. GROUPS TABLE & MEMBERSHIPS (ROLE-BASED PERMISSIONS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    avatar_url TEXT,
    cover_url TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    member_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS groups_slug_idx ON public.groups (slug);
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON public.groups (created_by);
CREATE INDEX IF NOT EXISTS groups_privacy_idx ON public.groups (privacy);

-- Trigger for groups updated_at
DROP TRIGGER IF EXISTS on_groups_updated_at ON public.groups;
CREATE TRIGGER on_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT group_members_unique_membership UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS group_members_status_idx ON public.group_members (group_id, status);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups RLS
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
CREATE POLICY "Public groups are viewable by everyone"
    ON public.groups FOR SELECT
    USING (
        privacy = 'public'
        OR auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
CREATE POLICY "Group admins can update groups"
    ON public.groups FOR UPDATE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
            AND group_members.status = 'active'
        )
    );

-- Group Members RLS
DROP POLICY IF EXISTS "Active group members are viewable" ON public.group_members;
CREATE POLICY "Active group members are viewable"
    ON public.group_members FOR SELECT
    USING (
        status = 'active'
        OR auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id
            AND g.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role IN ('admin', 'moderator')
            AND gm.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can join or request to join groups" ON public.group_members;
CREATE POLICY "Users can join or request to join groups"
    ON public.group_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins or users can update membership" ON public.group_members;
CREATE POLICY "Admins or users can update membership"
    ON public.group_members FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins or members themselves can leave or remove membership" ON public.group_members;
CREATE POLICY "Admins or members themselves can leave or remove membership"
    ON public.group_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );


-- ============================================================================
-- 5. PAGES TABLE, PAGE ROLES & PAGE FOLLOWERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    website TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    follower_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS pages_slug_idx ON public.pages (slug);
CREATE INDEX IF NOT EXISTS pages_category_idx ON public.pages (category);
CREATE INDEX IF NOT EXISTS pages_created_by_idx ON public.pages (created_by);

-- Trigger for pages updated_at
DROP TRIGGER IF EXISTS on_pages_updated_at ON public.pages;
CREATE TRIGGER on_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Page Members (Admin, Editor, Moderator)
CREATE TABLE IF NOT EXISTS public.page_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT page_members_unique_role UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS page_members_page_idx ON public.page_members (page_id);
CREATE INDEX IF NOT EXISTS page_members_user_idx ON public.page_members (user_id);

-- Page Followers
CREATE TABLE IF NOT EXISTS public.page_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT page_followers_unique UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS page_followers_page_idx ON public.page_followers (page_id);
CREATE INDEX IF NOT EXISTS page_followers_user_idx ON public.page_followers (user_id);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;

-- Pages RLS
DROP POLICY IF EXISTS "Pages are viewable by everyone" ON public.pages;
CREATE POLICY "Pages are viewable by everyone"
    ON public.pages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create pages" ON public.pages;
CREATE POLICY "Authenticated users can create pages"
    ON public.pages FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Page admins and editors can update pages" ON public.pages;
CREATE POLICY "Page admins and editors can update pages"
    ON public.pages FOR UPDATE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.page_members
            WHERE page_members.page_id = pages.id
            AND page_members.user_id = auth.uid()
            AND page_members.role IN ('admin', 'editor')
        )
    );

-- Page Members RLS
DROP POLICY IF EXISTS "Page members are viewable by everyone" ON public.page_members;
CREATE POLICY "Page members are viewable by everyone"
    ON public.page_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Page admins can manage page members" ON public.page_members;
CREATE POLICY "Page admins can manage page members"
    ON public.page_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE pages.id = page_members.page_id
            AND pages.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.page_members pm
            WHERE pm.page_id = page_members.page_id
            AND pm.user_id = auth.uid()
            AND pm.role = 'admin'
        )
    );

-- Page Followers RLS
DROP POLICY IF EXISTS "Page followers are viewable by everyone" ON public.page_followers;
CREATE POLICY "Page followers are viewable by everyone"
    ON public.page_followers FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow pages" ON public.page_followers;
CREATE POLICY "Authenticated users can follow pages"
    ON public.page_followers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow pages" ON public.page_followers;
CREATE POLICY "Users can unfollow pages"
    ON public.page_followers FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================================
-- 6. AUTOMATIC CREATOR MEMBERSHIP TRIGGERS
-- ============================================================================
-- Auto add group creator as group admin
CREATE OR REPLACE FUNCTION public.handle_new_group_creator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.group_members (group_id, user_id, role, status)
    VALUES (NEW.id, NEW.created_by, 'admin', 'active')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created_add_creator ON public.groups;
CREATE TRIGGER on_group_created_add_creator
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_group_creator();

-- Auto add page creator as page admin
CREATE OR REPLACE FUNCTION public.handle_new_page_creator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.page_members (page_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (page_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_page_created_add_creator ON public.pages;
CREATE TRIGGER on_page_created_add_creator
    AFTER INSERT ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_page_creator();
