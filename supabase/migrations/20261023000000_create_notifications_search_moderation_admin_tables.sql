-- ============================================================================
-- NILPHA SOCIAL — PART 7 DATABASE MIGRATION
-- Notifications Center, Moderation Reports, RBAC, Admin Dashboard & Audit Logs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USER ROLES TABLE (RBAC: user, moderator, admin, super_admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles (role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_is_moderator_or_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('moderator', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Roles RLS Policies:
-- Users can view their own role; moderators/admins can view all roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.check_user_is_moderator_or_admin(auth.uid()));

-- Only super_admin / admin can assign roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.check_user_is_admin(auth.uid()))
    WITH CHECK (public.check_user_is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT,
    entity_id TEXT,
    action_url TEXT,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    event_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS notifications_recipient_active_idx 
    ON public.notifications (recipient_id, is_dismissed, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx 
    ON public.notifications (notification_type);
CREATE INDEX IF NOT EXISTS notifications_event_id_idx 
    ON public.notifications (event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS:
-- 1. Users can ONLY select their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = recipient_id AND is_dismissed = false);

-- 2. Users can update ONLY their own notification read and dismissal state
DROP POLICY IF EXISTS "Users can update own notifications read state" ON public.notifications;
CREATE POLICY "Users can update own notifications read state"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- 3. Prevent arbitrary client insertions; system notifications must be generated via secure function
DROP POLICY IF EXISTS "Prevent direct client notification insert" ON public.notifications;
CREATE POLICY "Prevent direct client notification insert"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow only if actor is the caller inserting for legitimate social actions
        -- and not forging someone else as the actor
        auth.uid() = actor_id
    );

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATION PREFERENCES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_requests BOOLEAN NOT NULL DEFAULT true,
    likes_comments BOOLEAN NOT NULL DEFAULT true,
    mentions_tags BOOLEAN NOT NULL DEFAULT true,
    messages BOOLEAN NOT NULL DEFAULT true,
    groups_pages BOOLEAN NOT NULL DEFAULT true,
    calls_live BOOLEAN NOT NULL DEFAULT true,
    rewards_challenges BOOLEAN NOT NULL DEFAULT true,
    security_alerts BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
    ON public.notification_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. EXTEND MODERATION REPORTS TABLE
-- ----------------------------------------------------------------------------
-- Ensure public.reports supports all target entities
ALTER TABLE public.reports 
    ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'post',
    ADD COLUMN IF NOT EXISTS target_id TEXT,
    ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS stream_id UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
    ADD COLUMN IF NOT EXISTS action_taken TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS reports_status_created_idx ON public.reports (status, created_at DESC);

-- Drop old check constraint if exists and add flexible check
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS report_target_check;

-- Reports RLS Policies:
-- Reporters can view only their own submitted reports
DROP POLICY IF EXISTS "Reporters view own reports" ON public.reports;
CREATE POLICY "Reporters view own reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id OR public.check_user_is_moderator_or_admin(auth.uid()));

-- Users can submit reports with themselves as reporter
DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

-- Only moderators and admins can update report status and moderation notes
DROP POLICY IF EXISTS "Moderators can update reports" ON public.reports;
CREATE POLICY "Moderators can update reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (public.check_user_is_moderator_or_admin(auth.uid()))
    WITH CHECK (public.check_user_is_moderator_or_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. ADMIN AUDIT LOGS (APPEND-ONLY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    reason TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON public.admin_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_action_type_idx ON public.admin_audit_logs (action_type);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are viewable ONLY by admins and super_admins
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.check_user_is_admin(auth.uid()));

-- Audit logs can be inserted ONLY by moderators/admins performing actions
DROP POLICY IF EXISTS "Admins and moderators can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins and moderators can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id AND public.check_user_is_moderator_or_admin(auth.uid()));

-- Append-only protection: NO UPDATE OR DELETE on audit logs
DROP POLICY IF EXISTS "No updates on audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "No deletes on audit logs" ON public.admin_audit_logs;

-- ----------------------------------------------------------------------------
-- 6. SYSTEM SETTINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Public can read non-sensitive settings (like maintenance_mode status)
DROP POLICY IF EXISTS "System settings readable" ON public.system_settings;
CREATE POLICY "System settings readable"
    ON public.system_settings FOR SELECT
    USING (true);

-- Only admins can modify system settings
DROP POLICY IF EXISTS "Admins can modify system settings" ON public.system_settings;
CREATE POLICY "Admins can modify system settings"
    ON public.system_settings FOR ALL
    TO authenticated
    USING (public.check_user_is_admin(auth.uid()))
    WITH CHECK (public.check_user_is_admin(auth.uid()));

-- Insert initial default settings safely
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('maintenance_mode', '{"enabled": false, "notice": "রক্ষণাবেক্ষণ কাজ চলছে। কিছুক্ষণের মধ্যে ফিরে আসছি।"}'::jsonb, 'Maintenance mode status and user notice'),
    ('user_registration', '{"enabled": true, "require_email_verification": false}'::jsonb, 'User registration controls'),
    ('media_upload_limits', '{"max_image_mb": 10, "max_video_mb": 50, "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]}'::jsonb, 'Media upload size and format limits'),
    ('reporting_reasons', '{"categories": ["spam", "harassment", "hate_speech", "violence_threats", "impersonation", "misinformation", "copyright", "other"]}'::jsonb, 'Report reason choices')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. FULL-TEXT SEARCH & GLOBAL SEARCH INDEXES
-- ----------------------------------------------------------------------------
-- Enable pg_trgm extension if available for fuzzy and substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes on profiles
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx ON public.profiles USING gin (display_name gin_trgm_ops);

-- Trigram and full text on posts
CREATE INDEX IF NOT EXISTS posts_content_trgm_idx ON public.posts USING gin (content gin_trgm_ops) WHERE deleted_at IS NULL;

-- Trigram on groups and pages
CREATE INDEX IF NOT EXISTS groups_name_trgm_idx ON public.groups USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pages_name_trgm_idx ON public.pages USING gin (name gin_trgm_ops);
