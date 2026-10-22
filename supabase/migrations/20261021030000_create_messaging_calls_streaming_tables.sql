-- Nilpha Social - Part 5 Database Migration
-- Real-Time Messaging, Audio/Video Calling Sessions, and Live Streaming with Row Level Security (RLS)

-- ============================================================================
-- 1. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON public.conversations (created_by);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx ON public.conversations (last_message_at DESC);

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS on_conversations_updated_at ON public.conversations;
CREATE TRIGGER on_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 2. CONVERSATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    muted BOOLEAN NOT NULL DEFAULT false,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT conversation_members_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conv_members_conv_idx ON public.conversation_members (conversation_id);
CREATE INDEX IF NOT EXISTS conv_members_user_idx ON public.conversation_members (user_id);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: only members can view conversations
DROP POLICY IF EXISTS "Members can view their conversations" ON public.conversations;
CREATE POLICY "Members can view their conversations"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversations.id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Conversation admins or creators can update conversations" ON public.conversations;
CREATE POLICY "Conversation admins or creators can update conversations"
    ON public.conversations FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversations.id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- Conversation Members RLS
DROP POLICY IF EXISTS "Members can view membership of their conversations" ON public.conversation_members;
CREATE POLICY "Members can view membership of their conversations"
    ON public.conversation_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members my_mem
            WHERE my_mem.conversation_id = conversation_members.conversation_id
            AND my_mem.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can join or add members to conversations" ON public.conversation_members;
CREATE POLICY "Authenticated users can join or add members to conversations"
    ON public.conversation_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_members.conversation_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can update their own membership settings" ON public.conversation_members;
CREATE POLICY "Members can update their own membership settings"
    ON public.conversation_members FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can leave or admins can remove members" ON public.conversation_members;
CREATE POLICY "Members can leave or admins can remove members"
    ON public.conversation_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_members.conversation_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );


-- ============================================================================
-- 3. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'call_event')),
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS messages_conv_created_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON public.messages (reply_to_id);

-- Trigger for messages updated_at
DROP TRIGGER IF EXISTS on_messages_updated_at ON public.messages;
CREATE TRIGGER on_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update conversation's last_message_at on message insert
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS
DROP POLICY IF EXISTS "Conversation members can read messages" ON public.messages;
CREATE POLICY "Conversation members can read messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Conversation members can insert messages if not blocked" ON public.messages;
CREATE POLICY "Conversation members can insert messages if not blocked"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
            AND cm.user_id = auth.uid()
        )
        -- Enforce blocking rule: Cannot message if any member of direct conversation has blocked sender
        AND NOT EXISTS (
            SELECT 1 FROM public.conversation_members cm
            JOIN public.user_blocks ub ON ub.blocker_id = cm.user_id AND ub.blocked_id = auth.uid()
            WHERE cm.conversation_id = messages.conversation_id
        )
    );

DROP POLICY IF EXISTS "Senders can update their own messages" ON public.messages;
CREATE POLICY "Senders can update their own messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders can soft-delete their own messages" ON public.messages;
CREATE POLICY "Senders can soft-delete their own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);


-- ============================================================================
-- 4. MESSAGE ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS msg_attachments_message_idx ON public.message_attachments (message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view message attachments" ON public.message_attachments;
CREATE POLICY "Members can view message attachments"
    ON public.message_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
            WHERE m.id = message_attachments.message_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Senders can insert message attachments" ON public.message_attachments;
CREATE POLICY "Senders can insert message attachments"
    ON public.message_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
    );


-- ============================================================================
-- 5. MESSAGE REACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS msg_reactions_message_idx ON public.message_reactions (message_id);
CREATE INDEX IF NOT EXISTS msg_reactions_user_idx ON public.message_reactions (user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view message reactions" ON public.message_reactions;
CREATE POLICY "Members can view message reactions"
    ON public.message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can add their own reactions" ON public.message_reactions;
CREATE POLICY "Members can add their own reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove their own reactions"
    ON public.message_reactions FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================================
-- 6. CALL SESSIONS & PARTICIPANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL DEFAULT 'audio' CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL DEFAULT 'initiating' CHECK (status IN ('initiating', 'ringing', 'active', 'ended', 'declined', 'missed', 'failed')),
    room_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'webrtc',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS call_sessions_conv_idx ON public.call_sessions (conversation_id);
CREATE INDEX IF NOT EXISTS call_sessions_initiator_idx ON public.call_sessions (initiator_id);
CREATE INDEX IF NOT EXISTS call_sessions_status_idx ON public.call_sessions (status);

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'ringing', 'connected', 'left', 'declined', 'missed')),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT call_participants_unique UNIQUE (call_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS call_part_session_idx ON public.call_participants (call_session_id);
CREATE INDEX IF NOT EXISTS call_part_user_idx ON public.call_participants (user_id);

ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- Call Sessions RLS
DROP POLICY IF EXISTS "Authorized users can view call sessions" ON public.call_sessions;
CREATE POLICY "Authorized users can view call sessions"
    ON public.call_sessions FOR SELECT
    USING (
        auth.uid() = initiator_id
        OR EXISTS (
            SELECT 1 FROM public.call_participants cp
            WHERE cp.call_session_id = call_sessions.id
            AND cp.user_id = auth.uid()
        )
        OR (
            conversation_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.conversation_members cm
                WHERE cm.conversation_id = call_sessions.conversation_id
                AND cm.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can start calls" ON public.call_sessions;
CREATE POLICY "Authenticated users can start calls"
    ON public.call_sessions FOR INSERT
    WITH CHECK (auth.uid() = initiator_id);

DROP POLICY IF EXISTS "Participants can update call session status" ON public.call_sessions;
CREATE POLICY "Participants can update call session status"
    ON public.call_sessions FOR UPDATE
    USING (
        auth.uid() = initiator_id
        OR EXISTS (
            SELECT 1 FROM public.call_participants cp
            WHERE cp.call_session_id = call_sessions.id
            AND cp.user_id = auth.uid()
        )
    );

-- Call Participants RLS
DROP POLICY IF EXISTS "Users can view participants of their calls" ON public.call_participants;
CREATE POLICY "Users can view participants of their calls"
    ON public.call_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.call_sessions cs
            WHERE cs.id = call_participants.call_session_id
            AND (
                cs.initiator_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.call_participants cp2
                    WHERE cp2.call_session_id = cs.id
                    AND cp2.user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Initiators or users can insert participants" ON public.call_participants;
CREATE POLICY "Initiators or users can insert participants"
    ON public.call_participants FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.call_sessions cs
            WHERE cs.id = call_participants.call_session_id
            AND cs.initiator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Participants can update their own status" ON public.call_participants;
CREATE POLICY "Participants can update their own status"
    ON public.call_participants FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.call_sessions cs
            WHERE cs.id = call_participants.call_session_id
            AND cs.initiator_id = auth.uid()
        )
    );


-- ============================================================================
-- 7. LIVE STREAMS & MODERATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only', 'private')),
    status TEXT NOT NULL DEFAULT 'preview' CHECK (status IN ('preview', 'live', 'ended')),
    viewer_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS live_streams_host_idx ON public.live_streams (host_id);
CREATE INDEX IF NOT EXISTS live_streams_status_idx ON public.live_streams (status);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Live Stream Comments
CREATE TABLE IF NOT EXISTS public.live_stream_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS live_comments_stream_idx ON public.live_stream_comments (stream_id, created_at DESC);

ALTER TABLE public.live_stream_comments ENABLE ROW LEVEL SECURITY;

-- Live Stream Moderation Actions
CREATE TABLE IF NOT EXISTS public.live_stream_moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('block_viewer', 'remove_comment', 'report')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS live_mod_stream_idx ON public.live_stream_moderation_actions (stream_id);

ALTER TABLE public.live_stream_moderation_actions ENABLE ROW LEVEL SECURITY;

-- Live Streams RLS
DROP POLICY IF EXISTS "Public live streams are readable by everyone" ON public.live_streams;
CREATE POLICY "Public live streams are readable by everyone"
    ON public.live_streams FOR SELECT
    USING (
        visibility = 'public'
        OR auth.uid() = host_id
        OR (
            visibility = 'followers_only' AND EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = live_streams.host_id
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create streams" ON public.live_streams;
CREATE POLICY "Authenticated users can create streams"
    ON public.live_streams FOR INSERT
    WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their streams" ON public.live_streams;
CREATE POLICY "Hosts can update their streams"
    ON public.live_streams FOR UPDATE
    USING (auth.uid() = host_id);

-- Live Comments RLS
DROP POLICY IF EXISTS "Viewers can read stream comments" ON public.live_stream_comments;
CREATE POLICY "Viewers can read stream comments"
    ON public.live_stream_comments FOR SELECT
    USING (
        is_deleted = false
        OR EXISTS (
            SELECT 1 FROM public.live_streams ls
            WHERE ls.id = live_stream_comments.stream_id
            AND ls.host_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated viewers can comment on live streams" ON public.live_stream_comments;
CREATE POLICY "Authenticated viewers can comment on live streams"
    ON public.live_stream_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        -- Check if viewer is blocked by host from this stream
        AND NOT EXISTS (
            SELECT 1 FROM public.live_stream_moderation_actions ma
            WHERE ma.stream_id = live_stream_comments.stream_id
            AND ma.target_user_id = auth.uid()
            AND ma.action_type = 'block_viewer'
        )
    );

DROP POLICY IF EXISTS "Hosts can moderate comments" ON public.live_stream_comments;
CREATE POLICY "Hosts can moderate comments"
    ON public.live_stream_comments FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.live_streams ls
            WHERE ls.id = live_stream_comments.stream_id
            AND ls.host_id = auth.uid()
        )
    );

-- Moderation Actions RLS
DROP POLICY IF EXISTS "Hosts can view and insert moderation actions" ON public.live_stream_moderation_actions;
CREATE POLICY "Hosts can view and insert moderation actions"
    ON public.live_stream_moderation_actions FOR ALL
    USING (
        auth.uid() = moderator_id
        OR EXISTS (
            SELECT 1 FROM public.live_streams ls
            WHERE ls.id = live_stream_moderation_actions.stream_id
            AND ls.host_id = auth.uid()
        )
    );


-- ============================================================================
-- 8. STORAGE BUCKET FOR MESSAGE ATTACHMENTS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments',
    'message-attachments',
    false,
    52428800, -- 50MB limit
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip', 'text/plain', 'audio/mpeg', 'audio/mp4', 'audio/ogg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Conversation members can read attachments from bucket" ON storage.objects;
CREATE POLICY "Conversation members can read attachments from bucket"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'message-attachments'
        AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users can upload attachments to their folder" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments to their folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'message-attachments'
        AND auth.uid() IS NOT NULL
    );
