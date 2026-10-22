-- Nilpha Social - Part 6 Database Migration
-- Mini Games, Non-Cash Demo Coins Wallet, Secure Auditable Ledger, Game Sessions, Daily Rewards, Challenges, and Referral System

-- ============================================================================
-- 1. DEMO COIN WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demo_coin_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 200 CHECK (balance >= 0),
    total_earned INT NOT NULL DEFAULT 200 CHECK (total_earned >= 0),
    total_spent INT NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    is_initial_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT demo_coin_wallets_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.demo_coin_wallets (user_id);

-- Trigger for wallets updated_at
DROP TRIGGER IF EXISTS on_wallets_updated_at ON public.demo_coin_wallets;
CREATE TRIGGER on_wallets_updated_at
    BEFORE UPDATE ON public.demo_coin_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.demo_coin_wallets ENABLE ROW LEVEL SECURITY;

-- Wallets RLS
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.demo_coin_wallets;
CREATE POLICY "Users can view their own wallet"
    ON public.demo_coin_wallets FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users cannot directly modify wallet balances" ON public.demo_coin_wallets;
-- Note: No direct client UPDATE or INSERT allowed for ordinary users;
-- All balance mutations must occur through trusted SECURITY DEFINER database functions.


-- ============================================================================
-- 2. DEMO COIN TRANSACTIONS (AUDITABLE LEDGER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demo_coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.demo_coin_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- positive for credit, negative for debit
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'initial_grant',
        'game_reward',
        'daily_checkin',
        'challenge_reward',
        'referral_reward',
        'achievement_reward',
        'game_play_debit',
        'item_unlock_debit',
        'admin_adjustment'
    )),
    reason TEXT NOT NULL,
    reference_id TEXT, -- optional ID of game_session, referral, or challenge
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS coin_tx_user_idx ON public.demo_coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coin_tx_wallet_idx ON public.demo_coin_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS coin_tx_idempotency_idx ON public.demo_coin_transactions (idempotency_key);

ALTER TABLE public.demo_coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coin transactions" ON public.demo_coin_transactions;
CREATE POLICY "Users can view their own coin transactions"
    ON public.demo_coin_transactions FOR SELECT
    USING (auth.uid() = user_id);


-- ============================================================================
-- 3. GAME SESSIONS & SCORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL CHECK (game_id IN (
        'car-racing',
        'bubble-puzzle',
        'funny-runner',
        'memory-match',
        'tic-tac-toe',
        'seven-up'
    )),
    score INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    coins_rewarded INT NOT NULL DEFAULT 0 CHECK (coins_rewarded >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS game_sessions_user_game_idx ON public.game_sessions (user_id, game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS game_sessions_leaderboard_idx ON public.game_sessions (game_id, score DESC);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Game sessions are viewable by owner and for public leaderboards" ON public.game_sessions;
CREATE POLICY "Game sessions are viewable by owner and for public leaderboards"
    ON public.game_sessions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can record their completed game session" ON public.game_sessions;
CREATE POLICY "Authenticated users can record their completed game session"
    ON public.game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 4. DAILY REWARDS & CHECK-INS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_rewards_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_day INT NOT NULL DEFAULT 1 CHECK (streak_day BETWEEN 1 AND 7),
    coins_rewarded INT NOT NULL CHECK (coins_rewarded > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT daily_rewards_unique_per_day UNIQUE (user_id, claim_date)
);

CREATE INDEX IF NOT EXISTS daily_rewards_user_idx ON public.daily_rewards_claims (user_id, claim_date DESC);

ALTER TABLE public.daily_rewards_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their daily reward claims" ON public.daily_rewards_claims;
CREATE POLICY "Users can view their daily reward claims"
    ON public.daily_rewards_claims FOR SELECT
    USING (auth.uid() = user_id);


-- ============================================================================
-- 5. DAILY & WEEKLY CHALLENGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_key TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    title_en TEXT NOT NULL,
    target_count INT NOT NULL DEFAULT 1,
    current_count INT NOT NULL DEFAULT 0,
    reward_coins INT NOT NULL DEFAULT 20,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    period TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('daily', 'weekly')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_challenges_unique_period UNIQUE (user_id, challenge_key, expires_at)
);

CREATE INDEX IF NOT EXISTS user_challenges_lookup_idx ON public.user_challenges (user_id, expires_at);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON public.user_challenges;
CREATE POLICY "Users can view their own challenges"
    ON public.user_challenges FOR SELECT
    USING (auth.uid() = user_id);


-- ============================================================================
-- 6. REFERRAL SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    reward_coins INT NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_referrals_unique_referee UNIQUE (referee_id),
    CONSTRAINT user_referrals_no_self CHECK (referrer_id <> referee_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.user_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referee_idx ON public.user_referrals (referee_id);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view referrals they are involved in" ON public.user_referrals;
CREATE POLICY "Users can view referrals they are involved in"
    ON public.user_referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);


-- ============================================================================
-- 7. ACHIEVEMENTS SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    title_en TEXT NOT NULL,
    reward_coins INT NOT NULL DEFAULT 30,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS achievements_user_idx ON public.user_achievements (user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.user_achievements;
CREATE POLICY "Achievements are viewable by everyone"
    ON public.user_achievements FOR SELECT
    USING (true);


-- ============================================================================
-- 8. GAME SETTINGS & ADMIN CONTROLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_settings (
    game_id TEXT PRIMARY KEY,
    name_bn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    max_daily_reward INT NOT NULL DEFAULT 100,
    reward_per_win INT NOT NULL DEFAULT 20,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Game settings are readable by everyone" ON public.game_settings;
CREATE POLICY "Game settings are readable by everyone"
    ON public.game_settings FOR SELECT
    USING (true);

-- Seed initial game settings
INSERT INTO public.game_settings (game_id, name_bn, name_en, is_enabled, max_daily_reward, reward_per_win)
VALUES
    ('car-racing', 'মিনি কার রেসিং', 'Mini Car Racing', true, 100, 20),
    ('bubble-puzzle', 'বাবল পাজল', 'Bubble Puzzle', true, 100, 25),
    ('funny-runner', 'ফানি রানার', 'Funny Runner', true, 100, 20),
    ('memory-match', 'মেমোরি ম্যাচ', 'Memory Match', true, 100, 15),
    ('tic-tac-toe', 'টিক-ট্যাক-টো', 'Tic-Tac-Toe', true, 100, 10),
    ('seven-up', 'সেভেন আপ ডেমো এরিনা', 'Seven Up Demo Arena', true, 150, 30)
ON CONFLICT (game_id) DO NOTHING;


-- ============================================================================
-- 9. TRUSTED SERVER-SIDE STORED PROCEDURES (ATOMIC COIN LEDGER)
-- ============================================================================

-- Function: Ensure Wallet Exists and Give Initial 200 Demo Coins (Exactly Once)
CREATE OR REPLACE FUNCTION public.ensure_user_demo_wallet(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_tx_id UUID;
    v_idempotency_key TEXT;
BEGIN
    -- Check if wallet already exists
    SELECT * INTO v_wallet FROM public.demo_coin_wallets WHERE user_id = p_user_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'wallet_id', v_wallet.id,
            'balance', v_wallet.balance,
            'is_new', false
        );
    END IF;

    -- Create new wallet with initial 200 demo coins
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
    )
    RETURNING * INTO v_wallet;

    -- Record in transaction ledger with unique idempotency key
    v_idempotency_key := 'init_' || p_user_id::text;
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
    );

    RETURN jsonb_build_object(
        'success', true,
        'wallet_id', v_wallet.id,
        'balance', 200,
        'is_new', true
    );
END;
$$;

-- Function: Execute Coin Transaction with Idempotency & Balance Validation
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
AS $$
DECLARE
    v_wallet RECORD;
    v_new_balance INT;
    v_existing_tx RECORD;
BEGIN
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
        -- Auto initialize wallet if missing
        PERFORM public.ensure_user_demo_wallet(p_user_id);
        SELECT * INTO v_wallet
        FROM public.demo_coin_wallets
        WHERE user_id = p_user_id
        FOR UPDATE;
    END IF;

    -- Calculate new balance
    v_new_balance := v_wallet.balance + p_amount;

    -- Prevent negative balances on debit
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
