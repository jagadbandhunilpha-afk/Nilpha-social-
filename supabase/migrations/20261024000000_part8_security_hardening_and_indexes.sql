-- ============================================================================
-- NILPHA SOCIAL — PART 8 DATABASE MIGRATION
-- Production Readiness, Security Hardening, Performance Indexes & RLS Tightening
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HARDEN SECURITY DEFINER FUNCTIONS WITH EXPLICIT SEARCH_PATH
-- Prevents search_path hijacking attacks (CWE-426 / CVE vector in PostgreSQL)
-- ----------------------------------------------------------------------------

-- A. Timestamp handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- B. Protect profile fields
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Prevent altering primary user id
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'Profile ID cannot be changed.';
    END IF;

    -- Prevent non-privileged users from modifying administrative fields
    IF (NEW.account_status <> OLD.account_status OR NEW.verification_status <> OLD.verification_status) THEN
        IF auth.role() IS NULL OR (auth.role() <> 'service_role' AND NOT public.check_user_is_admin(auth.uid())) THEN
            RAISE EXCEPTION 'Permission denied: Cannot modify protected security or verification fields.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- C. User registration trigger with search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    initial_username TEXT;
    initial_display_name TEXT;
    initial_lang TEXT;
BEGIN
    initial_username := lower(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
    initial_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', initial_username);
    initial_lang := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn');

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
$$;

-- D. RBAC role checks with search path
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('admin', 'super_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_is_moderator_or_admin(p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('moderator', 'admin', 'super_admin')
    );
END;
$$;

-- E. Ensure user wallet with search path
CREATE OR REPLACE FUNCTION public.ensure_user_demo_wallet(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet RECORD;
    v_idempotency_key TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid user ID');
    END IF;

    SELECT * INTO v_wallet
    FROM public.demo_coin_wallets
    WHERE user_id = p_user_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'wallet_id', v_wallet.id,
            'balance', v_wallet.balance,
            'is_new', false
        );
    END IF;

    INSERT INTO public.demo_coin_wallets (
        user_id,
        balance,
        total_earned,
        total_spent,
        is_initial_granted
    ) VALUES (
        p_user_id,
        200,
        200,
        0,
        true
    ) RETURNING * INTO v_wallet;

    v_idempotency_key := 'init_grant_' || p_user_id::text;

    INSERT INTO public.demo_coin_transactions (
        wallet_id,
        user_id,
        amount,
        balance_after,
        transaction_type,
        reason,
        idempotency_key
    ) VALUES (
        v_wallet.id,
        p_user_id,
        200,
        200,
        'initial_grant',
        'স্বাগতম বোনাস: নতুন অ্যাকাউন্টের জন্য প্রাথমিক ২০০ ডেমো কয়েন উপহার',
        v_idempotency_key
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'wallet_id', v_wallet.id,
        'balance', 200,
        'is_new', true
    );
END;
$$;

-- F. Execute coin transaction with search path and authorization checks
CREATE OR REPLACE FUNCTION public.execute_coin_transaction(
    p_user_id UUID,
    p_amount INT,
    p_type TEXT,
    p_reason TEXT,
    p_ref_id TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet RECORD;
    v_new_balance INT;
    v_existing_tx RECORD;
BEGIN
    -- Authorization check: Ensure client cannot debit another user's wallet
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        IF NOT public.check_user_is_admin(auth.uid()) AND auth.role() <> 'service_role' THEN
            RAISE EXCEPTION 'Unauthorized: cannot alter another user wallet.';
        END IF;
    END IF;

    -- Check for duplicate transaction
    SELECT * INTO v_existing_tx
    FROM public.demo_coin_transactions
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'duplicate', true,
            'balance', v_existing_tx.balance_after,
            'tx_id', v_existing_tx.id
        );
    END IF;

    -- Lock and retrieve user wallet
    SELECT * INTO v_wallet
    FROM public.demo_coin_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM public.ensure_user_demo_wallet(p_user_id);
        SELECT * INTO v_wallet
        FROM public.demo_coin_wallets
        WHERE user_id = p_user_id
        FOR UPDATE;
    END IF;

    v_new_balance := v_wallet.balance + p_amount;

    -- Prevent negative balances
    IF v_new_balance < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'অপর্যাপ্ত ডেমো কয়েন ব্যালেন্স (Insufficient coin balance)'
        );
    END IF;

    -- Update wallet balance and totals atomically
    IF p_amount > 0 THEN
        UPDATE public.demo_coin_wallets
        SET balance = v_new_balance,
            total_earned = total_earned + p_amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_wallet.id;
    ELSE
        UPDATE public.demo_coin_wallets
        SET balance = v_new_balance,
            total_spent = total_spent + ABS(p_amount),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_wallet.id;
    END IF;

    -- Record transaction ledger entry
    INSERT INTO public.demo_coin_transactions (
        wallet_id,
        user_id,
        amount,
        balance_after,
        transaction_type,
        reason,
        reference_id,
        idempotency_key
    ) VALUES (
        v_wallet.id,
        p_user_id,
        p_amount,
        v_new_balance,
        p_type,
        p_reason,
        p_ref_id,
        p_idempotency_key
    );

    RETURN jsonb_build_object(
        'success', true,
        'duplicate', false,
        'balance', v_new_balance,
        'amount', p_amount
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. IMMUTABLE AUDIT LOG ENFORCEMENT
-- Strictly forbid UPDATE and DELETE on public.admin_audit_logs
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS on_audit_log_immutable ON public.admin_audit_logs;
CREATE TRIGGER on_audit_log_immutable
    BEFORE UPDATE OR DELETE ON public.admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_mutation();


-- ----------------------------------------------------------------------------
-- 3. EXTEND PROFILES CHECK CONSTRAINT FOR 'BANNED' STATUS
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check 
    CHECK (account_status IN ('active', 'suspended', 'pending', 'banned'));


-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES FOR PRODUCTION QUERY WORKLOADS
-- ----------------------------------------------------------------------------

-- Feed & Post author lookups
CREATE INDEX IF NOT EXISTS posts_author_created_idx 
    ON public.posts (author_id, created_at DESC) 
    WHERE deleted_at IS NULL;

-- Post comments chronologically
CREATE INDEX IF NOT EXISTS comments_post_created_idx 
    ON public.comments (post_id, created_at ASC) 
    WHERE deleted_at IS NULL;

-- Direct & Group message pagination
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx 
    ON public.messages (conversation_id, created_at ASC) 
    WHERE deleted_at IS NULL;

-- Active notifications per user
CREATE INDEX IF NOT EXISTS notifications_user_active_idx 
    ON public.notifications (recipient_id, is_dismissed, read_at);

-- Friendship pairs lookups
CREATE INDEX IF NOT EXISTS friendships_user_a_b_idx 
    ON public.friendships (user_a_id, user_b_id);

CREATE INDEX IF NOT EXISTS friendships_user_b_a_idx 
    ON public.friendships (user_b_id, user_a_id);

-- User blocks lookup
CREATE INDEX IF NOT EXISTS user_blocks_blocker_blocked_idx 
    ON public.user_blocks (blocker_id, blocked_id);

-- Conversations by latest message update
CREATE INDEX IF NOT EXISTS conversations_updated_idx 
    ON public.conversations (updated_at DESC);


-- ----------------------------------------------------------------------------
-- 5. SECURE ACCOUNT DELETION STORED PROCEDURE
-- Cascades user personal content while maintaining auditable ledger integrity
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Verify actor
    IF auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.check_user_is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized: only account owner or administrator can delete account.';
    END IF;

    -- 1. Soft delete or anonymize personal posts
    UPDATE public.posts
    SET deleted_at = timezone('utc'::text, now()),
        content = '[অ্যাকাউন্ট মুছে ফেলার কারণে এই পোস্টটি অপসারিত হয়েছে]'
    WHERE author_id = p_user_id AND deleted_at IS NULL;

    -- 2. Soft delete personal comments
    UPDATE public.comments
    SET deleted_at = timezone('utc'::text, now()),
        content = '[মন্তব্য অপসারিত]'
    WHERE author_id = p_user_id AND deleted_at IS NULL;

    -- 3. Remove post likes and bookmarks
    DELETE FROM public.post_likes WHERE user_id = p_user_id;
    DELETE FROM public.bookmarks WHERE user_id = p_user_id;

    -- 4. Delete friend requests and friendships
    DELETE FROM public.friend_requests WHERE sender_id = p_user_id OR receiver_id = p_user_id;
    DELETE FROM public.friendships WHERE user_a_id = p_user_id OR user_b_id = p_user_id;

    -- 5. Dismiss notifications
    DELETE FROM public.notifications WHERE recipient_id = p_user_id;

    -- 6. Anonymize profile and set status to suspended/banned
    UPDATE public.profiles
    SET display_name = 'Deleted User',
        bio = NULL,
        avatar_url = NULL,
        account_status = 'suspended',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- 7. Record in audit trail
    INSERT INTO public.admin_audit_logs (
        actor_id,
        action_type,
        target_type,
        target_id,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        'account_deletion',
        'user',
        p_user_id,
        'ব্যবহারকারীর নিজস্ব অনুরোধে অ্যাকাউন্ট মুছে ফেলা হয়েছে।',
        jsonb_build_object('timestamp', timezone('utc'::text, now()))
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'অ্যাকাউন্ট সফলভাবে অপসারিত হয়েছে।'
    );
END;
$$;
