-- Nilpha Social - Part 2 Database Migration
-- Table: public.profiles
-- Supports real authentication, user profiles, and account security

-- 1. Create profiles table referencing auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    verification_status TEXT NOT NULL DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT username_format_check CHECK (username ~* '^[a-z0-9_]{3,30}$')
);

-- 2. Indexes for performance and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles (account_status);

-- 3. Automatic timestamp update trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Prevent users from modifying protected fields (account_status, verification_status, id)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow changes to display_name, bio, avatar_url, preferred_language, and updated_at
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'Profile ID cannot be changed.';
    END IF;

    -- Non-admin users cannot change account_status or verification_status
    -- In Supabase RLS, check if user is altering protected administrative fields
    IF (NEW.account_status <> OLD.account_status OR NEW.verification_status <> OLD.verification_status) THEN
        -- Allow only if called by a trusted service role (auth.role() = 'service_role')
        IF auth.role() IS NULL OR auth.role() <> 'service_role' THEN
            RAISE EXCEPTION 'Permission denied: Cannot modify protected security or verification fields.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_protect_fields ON public.profiles;
CREATE TRIGGER on_profiles_protect_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- 5. Automatic profile creation trigger upon user registration in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_username TEXT;
    initial_display_name TEXT;
    initial_lang TEXT;
BEGIN
    -- Extract metadata passed during supabase.auth.signUp()
    initial_username := lower(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
    initial_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', initial_username);
    initial_lang := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn');

    -- Insert safely with conflict handling
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        bio,
        avatar_url,
        preferred_language,
        account_status,
        verification_status
    ) VALUES (
        NEW.id,
        initial_username,
        initial_display_name,
        NULL,
        NULL,
        initial_lang,
        'active',
        'none'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (authenticated or guest) can read active profiles
DROP POLICY IF EXISTS "Active profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Active profiles are publicly viewable"
    ON public.profiles
    FOR SELECT
    USING (account_status = 'active');

-- Policy 2: Authenticated user can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 3: Authenticated user can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 7. Supabase Storage bucket setup for avatars (optional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
