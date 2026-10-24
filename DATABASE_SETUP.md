# Nilpha Social — Database & Security Setup Guide (Part 2)

This document explains the PostgreSQL schema, Row Level Security (RLS) policies, database triggers, and storage configuration for **Nilpha Social Part 2**.

---

## 1. Migration Overview

The migration script is located at:
`supabase/migrations/20261021000000_create_profiles_table.sql`

It provisions:
1. `public.profiles` table with foreign key constraint to `auth.users(id)`.
2. Format validation constraints on `username` (`^[a-z0-9_]{3,30}$`).
3. Case-insensitive unique index on `lower(username)`.
4. Automated `updated_at` trigger.
5. Field protection trigger preventing client modifications to `account_status`, `verification_status`, and `id`.
6. Automatic profile initialization trigger (`on_auth_user_created`) on `auth.users`.
7. Row Level Security (RLS) policies for SELECT, INSERT, and UPDATE.
8. Storage bucket `avatars` with user-folder RLS.

---

## 2. Applying the Migration

### Option A: Via Supabase Web Dashboard (Recommended for quick setup)
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation, click **SQL Editor**.
4. Click **New Query**.
5. Copy and paste the entire contents of `supabase/migrations/20261021000000_create_profiles_table.sql`.
6. Click **Run** (or press Ctrl/Cmd + Enter).
7. Confirm that the query returns `Success. No rows returned`.

### Option B: Via Supabase CLI
```bash
supabase link --project-ref your-project-id
supabase db push
```

---

## 3. Database Schema: `public.profiles`

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Authenticated user UUID |
| `username` | `TEXT` | `UNIQUE NOT NULL CHECK (username ~* '^[a-z0-9_]{3,30}$')` | Unique normalized username |
| `display_name` | `TEXT` | `NOT NULL` | Public user display name |
| `bio` | `TEXT` | `NULL` | Optional short biography |
| `avatar_url` | `TEXT` | `NULL` | Image path in storage |
| `preferred_language` | `TEXT` | `NOT NULL DEFAULT 'bn' CHECK ('bn', 'en')` | Preferred UI language |
| `account_status` | `TEXT` | `NOT NULL DEFAULT 'active' CHECK ('active', 'suspended', 'pending')` | Controlled account state |
| `verification_status`| `TEXT` | `NOT NULL DEFAULT 'none' CHECK ('none', 'pending', 'verified')` | Platform verification status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc', now())` | Last update timestamp |

---

## 4. Row Level Security (RLS) & Access Policies

RLS is enabled on `public.profiles`. The following policies are enforced:

### Policy 1: `Active profiles are publicly viewable` (SELECT)
- **Target**: Public (authenticated and unauthenticated visitors).
- **Condition**: `account_status = 'active'`.
- Suspended or deleted profiles are hidden from public queries.

### Policy 2: `Users can insert their own profile` (INSERT)
- **Target**: `authenticated` users only.
- **Condition**: `auth.uid() = id`.
- Prevents any user from inserting rows on behalf of another user.

### Policy 3: `Users can update own profile` (UPDATE)
- **Target**: `authenticated` users only.
- **Condition**: `auth.uid() = id` (both USING and WITH CHECK).
- Enforces ownership on all update statements.

### Protected Administrative Fields
The `protect_profile_fields` PostgreSQL trigger ensures that even with update permissions, ordinary users cannot modify:
- `id` (cannot reassign ownership to another user).
- `account_status` (cannot un-suspend their own account).
- `verification_status` (cannot assign themselves a verified status).
*Only queries executed with the Supabase `service_role` (e.g. admin backend scripts) may alter these columns.*

---

## 5. Supabase Storage for Avatars

The migration script creates a public storage bucket named `avatars`.

Storage access policies enforce:
- **Public Read**: Anyone can load avatar images.
- **Scoped Upload**: Authenticated users can only upload files into their own user folder (`/avatars/<user_id>/...`).
- **Scoped Update**: Users can only overwrite files within their own folder.

---

## 6. Social Feed Tables (Part 3)

The Part 3 migration script is located at:
`supabase/migrations/20261021010000_create_feed_tables.sql`

It provisions:

### 1. `public.posts`
- `id` (UUID, Primary Key)
- `author_id` (UUID references `public.profiles(id)` on delete cascade)
- `content` (TEXT, up to 5,000 characters)
- `visibility` ('public' | 'private')
- `created_at` / `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ, soft-delete support)
- **RLS**: Public read for undeleted public posts. Authors can insert, update, or soft-delete their own posts.

### 2. `public.post_media`
- `id` (UUID, Primary Key)
- `post_id` (UUID references `public.posts(id)` on delete cascade)
- `storage_path` (TEXT in bucket `post-media`)
- `media_type` ('image' | 'video')
- `mime_type` (TEXT)
- `file_size` (BIGINT)
- `display_order` (INT)
- **RLS**: Public read for undeleted posts' media. Author-only insert/delete.

### 3. `public.post_likes`
- `id` (UUID, Primary Key)
- `post_id` (UUID references `public.posts(id)`)
- `user_id` (UUID references `auth.users(id)`)
- Unique constraint `(post_id, user_id)`
- **RLS**: Public read. Authenticated users can insert/delete only their own likes (`auth.uid() = user_id`).

### 4. `public.comments`
- `id` (UUID, Primary Key)
- `post_id` (UUID references `public.posts(id)`)
- `author_id` (UUID references `public.profiles(id)`)
- `parent_comment_id` (UUID references `public.comments(id)` for nested replies)
- `content` (TEXT)
- `deleted_at` (TIMESTAMPTZ)
- **RLS**: Public read for non-deleted comments. Authenticated users can insert comments and soft-delete/edit their own comments.

### 5. `public.bookmarks`
- `id` (UUID, Primary Key)
- `post_id` (UUID references `public.posts(id)`)
- `user_id` (UUID references `auth.users(id)`)
- Unique constraint `(post_id, user_id)`
- **RLS**: Private to owner (`auth.uid() = user_id`). Users can only view, create, and remove their own bookmarks.

### 6. `public.reports` (Moderation)
- `id` (UUID, Primary Key)
- `reporter_id` (UUID references `auth.users(id)`)
- `post_id` (UUID optional target)
- `comment_id` (UUID optional target)
- `reason` ('spam' | 'harassment' | 'impersonation' | 'inappropriate' | 'other')
- `details` (TEXT)
- `status` ('pending' | 'reviewed' | 'dismissed' | 'actioned')
- **RLS**: Authenticated users can insert reports. Only service_role/admin can read or update reports.

---

## 7. Supabase Storage for Post Media (`post-media`)

The migration script creates a public storage bucket named `post-media`.

Policies:
- **Public Read**: Anyone can stream and view uploaded images and videos for public posts.
- **Scoped Upload**: Authenticated users can only upload files into their own user folder (`/post-media/<user_id>/...`).
- **Scoped Delete**: Users can only delete media from their own folder.

---

## 8. Part 4 Database Architecture: Relationships, Groups, Pages & Roles

The Part 4 migration script is located at:
`supabase/migrations/20261021020000_create_relationships_and_communities_tables.sql`

It provisions:

### 1. `public.follows`
- `follower_id` (UUID references `public.profiles(id)` on delete cascade)
- `following_id` (UUID references `public.profiles(id)` on delete cascade)
- `created_at` (TIMESTAMPTZ)
- Primary Key: `(follower_id, following_id)`
- Constraint: `follower_id <> following_id` (no self-follows)
- **RLS**: Viewable by everyone. Authenticated user can only insert/delete follows where `auth.uid() = follower_id`.

### 2. `public.friend_requests`
- `id` (UUID Primary Key)
- `sender_id` (UUID references `public.profiles(id)`)
- `receiver_id` (UUID references `public.profiles(id)`)
- `status` ('pending' | 'rejected')
- Constraint: `sender_id <> receiver_id`
- Unique constraint: `(sender_id, receiver_id)`
- **RLS**: Visible to sender and receiver. Sender can insert and cancel (`auth.uid() = sender_id`). Receiver can update status or accept/decline (`auth.uid() = receiver_id`).

### 3. `public.friendships`
- `id` (UUID Primary Key)
- `user_a_id` (UUID references `public.profiles(id)`)
- `user_b_id` (UUID references `public.profiles(id)`)
- `created_at` (TIMESTAMPTZ)
- Ordering check: `user_a_id < user_b_id` for deterministic canonical pairs
- Unique constraint: `(user_a_id, user_b_id)`
- **RLS**: Public read. Insert / Delete allowed only by participants (`auth.uid() = user_a_id OR auth.uid() = user_b_id`).

### 4. `public.user_blocks`
- `blocker_id` (UUID references `public.profiles(id)`)
- `blocked_id` (UUID references `public.profiles(id)`)
- Primary Key: `(blocker_id, blocked_id)`
- **RLS**: Only visible to and modifiable by the blocker (`auth.uid() = blocker_id`).

### 5. `public.groups`
- `id` (UUID Primary Key)
- `name` (TEXT)
- `slug` (TEXT UNIQUE)
- `description` (TEXT)
- `privacy` ('public' | 'private')
- `avatar_url`, `cover_url` (TEXT)
- `created_by` (UUID references `public.profiles(id)`)
- `member_count` (INT)
- **RLS**: Public groups viewable by everyone; private groups viewable by creator or approved members. Admins can update.
- **Trigger**: Automatic creator membership added as `admin` upon creation.

### 6. `public.group_members`
- `id` (UUID Primary Key)
- `group_id` (UUID references `public.groups(id)`)
- `user_id` (UUID references `public.profiles(id)`)
- `role` ('admin' | 'moderator' | 'member')
- `status` ('active' | 'pending')
- Unique constraint: `(group_id, user_id)`
- **RLS**: Active members visible to everyone; pending requests visible to user and group admins. Admins can promote/demote or approve/reject requests.

### 7. `public.pages` & `public.page_members`
- `pages`: `id`, `name`, `slug` (UNIQUE), `category`, `description`, `website`, `avatar_url`, `cover_url`, `created_by`, `follower_count`.
- `page_members`: `page_id`, `user_id`, `role` ('admin' | 'editor' | 'moderator').
- `page_followers`: `page_id`, `user_id`, `created_at`.
- **RLS**: Pages publicly viewable. Admins and editors can update page details. Authenticated users can follow and unfollow pages.
- **Trigger**: Automatic creator membership added as page `admin`.

---

## 9. Part 5 Database Architecture: Messaging, Audio/Video Calling & Live Streaming

The Part 5 migration script is located at:
`supabase/migrations/20261021030000_create_messaging_calls_streaming_tables.sql`

It provisions:

### 1. `public.conversations`
- `id` (UUID Primary Key)
- `type` ('direct' | 'group')
- `title` (TEXT, optional for groups)
- `avatar_url` (TEXT, optional)
- `created_by` (UUID references `public.profiles(id)`)
- `last_message_at` (TIMESTAMPTZ, auto-updated on new message)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Only conversation members can select and view conversations. Only authenticated members can create conversations. Admins can update.

### 2. `public.conversation_members`
- `id` (UUID Primary Key)
- `conversation_id` (UUID references `public.conversations(id)` on delete cascade)
- `user_id` (UUID references `public.profiles(id)` on delete cascade)
- `role` ('admin' | 'member')
- `muted` (BOOLEAN, default false)
- `notifications_enabled` (BOOLEAN, default true)
- `last_read_at` (TIMESTAMPTZ)
- `joined_at` (TIMESTAMPTZ)
- Unique constraint: `(conversation_id, user_id)`
- **RLS**: Members can read members of their own conversations. Users can update their own settings (muted, last_read_at). Admins or the user themselves can remove membership.

### 3. `public.messages`
- `id` (UUID Primary Key)
- `conversation_id` (UUID references `public.conversations(id)` on delete cascade)
- `sender_id` (UUID references `public.profiles(id)`)
- `content` (TEXT)
- `message_type` ('text' | 'image' | 'file' | 'system' | 'call_event')
- `reply_to_id` (UUID references `public.messages(id)` on delete set null)
- `is_edited` (BOOLEAN, default false)
- `deleted_at` (TIMESTAMPTZ, soft delete)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Only conversation members can read messages. Senders can insert messages (enforcing block constraints: blocked users cannot send messages). Senders can edit or soft-delete only their own messages.
- **Trigger**: Automatic update of `conversations.last_message_at` on every insert.

### 4. `public.message_attachments`
- `id` (UUID Primary Key)
- `message_id` (UUID references `public.messages(id)` on delete cascade)
- `file_url`, `file_name`, `file_size`, `file_type` (TEXT / BIGINT)
- **RLS**: Viewable only by members of the message's conversation. Insertable by the message sender.

### 5. `public.message_reactions`
- `id` (UUID Primary Key)
- `message_id` (UUID references `public.messages(id)` on delete cascade)
- `user_id` (UUID references `public.profiles(id)` on delete cascade)
- `reaction` (TEXT emoji)
- Unique constraint: `(message_id, user_id, reaction)`
- **RLS**: Viewable by conversation members. Users can add or delete only their own reactions.

### 6. `public.call_sessions` & `public.call_participants`
- `call_sessions`: `id`, `conversation_id`, `initiator_id`, `call_type` ('audio' | 'video'), `status` ('initiating' | 'ringing' | 'active' | 'ended' | 'declined' | 'missed' | 'failed'), `room_id`, `provider`, `started_at`, `ended_at`.
- `call_participants`: `call_session_id`, `user_id`, `role` ('host' | 'participant'), `status` ('invited' | 'ringing' | 'connected' | 'left' | 'declined' | 'missed'), `joined_at`, `left_at`.
- **RLS**: Authorized participants can view and update their own participant records and call status.

### 7. `public.live_streams` & `public.live_stream_comments`
- `live_streams`: `id`, `host_id`, `title`, `description`, `visibility` ('public' | 'followers_only' | 'private'), `status` ('preview' | 'live' | 'ended'), `viewer_count`, `started_at`, `ended_at`.
- `live_stream_comments`: `stream_id`, `user_id`, `content`, `is_pinned`, `is_deleted`.
- `live_stream_moderation_actions`: `stream_id`, `moderator_id`, `target_user_id`, `action_type` ('block_viewer' | 'remove_comment' | 'report'), `reason`.
- **RLS**: Public streams readable by everyone. Hosts can update stream status. Viewers can send comments (unless blocked by host moderation actions). Hosts can pin or delete comments and block viewers.

### 8. Supabase Storage: `message-attachments` Bucket
- **Bucket**: `message-attachments` (50MB file size limit, private bucket)
- **RLS**: Scoped upload and select for authenticated conversation members.

### 9. Calling Provider Setup (LiveKit SFU / Agora / WebRTC)
- **Default Development Mode**: Real browser WebRTC media capture via `navigator.mediaDevices.getUserMedia` with audio & video tracks, mute/unmute, and camera toggle.
- **Production Scalability (LiveKit SFU)**:
  1. Create a LiveKit project at [LiveKit Cloud](https://livekit.io).
  2. Set `VITE_CALLING_PROVIDER="livekit"` and `VITE_LIVEKIT_URL="wss://your-livekit.livekit.cloud"` in client env.
  3. Deploy a Supabase Edge Function `generate-livekit-token` with server-side `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` to mint short-lived join tokens. Never expose secrets in client code.

---

## 10. Nilpha Social — Part 6: Games Hub, Demo Coins Wallet, Rewards, Challenges & Referrals

The Part 6 database migration is located at:
`supabase/migrations/20261022000000_create_games_wallet_rewards_tables.sql`

### Non-Cash Demo Currency Policy
- All coins are non-cash, non-transferable demo tokens.
- They cannot be purchased with real money, withdrawn to banks or mobile money, or converted to cash.
- There are no deposits, gambling, or real-money payouts.

### Database Tables:
1. `public.demo_coin_wallets`:
   - `user_id` (PRIMARY KEY REFERENCES auth.users)
   - `balance` (BIGINT NOT NULL DEFAULT 200 CHECK (balance >= 0))
   - `total_earned` (BIGINT NOT NULL DEFAULT 200)
   - `total_spent` (BIGINT NOT NULL DEFAULT 0)
   - `initial_grant_given` (BOOLEAN NOT NULL DEFAULT true)
   - `created_at`, `updated_at`

2. `public.demo_coin_transactions`:
   - Auditable append-only ledger with `id`, `user_id`, `amount` (integer), `balance_after`, `transaction_type`, `reason`, `idempotency_key` (UNIQUE), `reference_id`, `created_at`.
   - Idempotency key prevents replay attacks and duplicate reward claims.

3. `public.game_sessions`:
   - Tracks mini game sessions: `user_id`, `game_id`, `score`, `duration_seconds`, `coins_rewarded`, `session_data`, `created_at`.

4. `public.daily_rewards_claims`:
   - Tracks 7-day streak calendar: `user_id`, `claim_date` (UNIQUE per user per calendar day), `streak_count`, `day_number`, `reward_coins`, `created_at`.

5. `public.user_challenges`:
   - Daily and weekly missions with `target`, `progress`, `reward_coins`, `is_claimed`, `expires_at`.

6. `public.user_referrals`:
   - Unique referral codes (`NILPHA-XXXXXX`) and invite records.
   - Enforces `referrer_id <> referee_id` (no self-referral) and unique referee constraint.

7. `public.user_achievements`:
   - Tracks milestone progress and badge unlocks with demo coin rewards.

8. `public.game_settings`:
   - Admin-configurable daily reward caps and coin limits.

### Atomic Stored Procedures:
- `ensure_user_demo_wallet(p_user_id)`:
  Provisions wallet with exactly 200 demo coins starting balance once per account.
- `execute_coin_transaction(p_user_id, p_amount, p_tx_type, p_reason, p_idempotency_key, p_ref_id)`:
  Executes atomic debit/credit, enforces `balance_after >= 0`, verifies idempotency, updates `total_earned`/`total_spent`, and appends an auditable ledger record.

### Row Level Security (RLS) & Protection:
- Direct client `UPDATE` or `DELETE` on `demo_coin_wallets` and `demo_coin_transactions` is strictly rejected by RLS.
- Balance mutations occur strictly through trusted stored procedures or backend verification.
- Users can read only their own wallet, transactions, claims, and referrals.
- Public read is permitted only for game leaderboards and aggregated scores.

---

## 11. Part 7 Database Architecture: Notifications, Global Search, Reporting, Moderation & Admin Dashboard

The Part 7 migration script is located at:
`supabase/migrations/20261023000000_create_notifications_search_moderation_admin_tables.sql`

It provisions:

### 1. `public.user_roles` (RBAC)
- `id` (UUID Primary Key)
- `user_id` (UUID references `public.profiles(id)` UNIQUE)
- `role` ('user' | 'moderator' | 'admin' | 'super_admin')
- `granted_by` (UUID references `public.profiles(id)`)
- `granted_at` (TIMESTAMPTZ)
- Helper functions: `check_user_is_admin(user_uuid)` and `check_user_is_moderator_or_admin(user_uuid)`.
- **RLS**: Users can read their own role. Administrators can view and update user roles.

### 2. `public.notifications`
- `id` (UUID Primary Key)
- `recipient_id` (UUID references `public.profiles(id)`)
- `actor_id` (UUID references `public.profiles(id)`)
- `notification_type` ('friend_request', 'friend_accept', 'follow', 'post_like', 'comment', 'mention', 'group_invite', 'message', 'call_missed', 'live_stream', 'reward_claimed', 'security_alert')
- `title`, `body` (TEXT)
- `entity_type` ('post', 'profile', 'group', 'page', 'conversation', 'stream', 'wallet')
- `entity_id` (TEXT)
- `action_url` (TEXT)
- `read_at` (TIMESTAMPTZ, NULL if unread)
- `is_dismissed` (BOOLEAN)
- `event_id` (TEXT UNIQUE for event deduplication & idempotency)
- `created_at` (TIMESTAMPTZ)
- **RLS**: Strict isolation. Users can select and update read/dismissed flags ONLY for rows where `auth.uid() = recipient_id`. Direct client inserts for other users are forbidden.

### 3. `public.notification_preferences`
- `user_id` (UUID references `public.profiles(id)` PRIMARY KEY)
- Category toggles: `social_alerts`, `messages_calls`, `groups_pages`, `rewards_games`, `system_security`, `email_digest`
- **RLS**: User-exclusive read and update (`auth.uid() = user_id`).

### 4. `public.reports` (Comprehensive Moderation Queue)
- Extended columns: `target_type` ('post', 'comment', 'profile', 'message', 'group', 'page', 'stream'), `target_id`, `reported_user_id`, `reason_category`, `details`, `status` ('pending', 'reviewed', 'resolved', 'dismissed'), `action_taken`, `moderator_notes`, `reviewed_by`, `reviewed_at`.
- **Reporter Anonymity**: RLS ensures regular users can view only reports they submitted (`auth.uid() = reporter_id`). Reported parties can never see who reported them or access the reporter's ID.
- **Moderator Access**: Moderators and admins have full review and update permissions.

### 5. `public.admin_audit_logs` (Immutable Audit Trail)
- `id` (UUID Primary Key)
- `actor_id` (UUID references `public.profiles(id)`)
- `action_type` ('report_review', 'content_delete', 'user_suspend', 'user_ban', 'role_change', 'system_setting_update')
- `target_type`, `target_id`
- `reason` (TEXT)
- `metadata` (JSONB)
- `ip_address` (TEXT)
- `created_at` (TIMESTAMPTZ)
- **Security**: Append-only. RLS prohibits UPDATE and DELETE actions for all users (including admins). Only moderators and admins can read audit logs.

### 6. `public.system_settings`
- Key-value platform settings with admin update privileges.
- Pre-seeded with maintenance mode, open registration, max upload size, and daily demo coin reward caps.

### 7. Trigram GIN Search Indexes
- Enabled `pg_trgm` extension.
- Added GIN trigram indexes on `profiles(username, display_name)`, `posts(content)`, `groups(name, description)`, and `pages(name, description)` for fast fuzzy global search in Bengali and English.

---

## 11. Part 8 Migration: Security Hardening, Search Paths, and High-Throughput Indexes

The migration script is located at:
`supabase/migrations/20261024000000_part8_security_hardening_and_indexes.sql`

It provisions:
1. **Search Path Hardening**: Applies `SET search_path = public, pg_temp;` across all `SECURITY DEFINER` functions, preventing PostgreSQL search-path poisoning attacks.
2. **Coin Transaction Authorization**: Hardens `execute_coin_transaction` by asserting `auth.uid() = p_user_id` or verifying admin privileges.
3. **Audit Log Immutability**: Implements `prevent_audit_log_mutation()` trigger forbidding any `UPDATE` or `DELETE` operations on `audit_logs` and `admin_audit_logs`.
4. **Account Suspension Constraint**: Updates `profiles_account_status_check` constraint to support `'banned'`.
5. **GDPR/Privacy Account Deletion**: Creates stored procedure `public.request_account_deletion` which cleans personal records while keeping financial audit ledgers intact.
6. **High-Throughput Composite Indexes**:
   - `idx_posts_user_created`: `posts(user_id, created_at DESC)`
   - `idx_comments_post_created`: `comments(post_id, created_at ASC)`
   - `idx_messages_conversation_created`: `messages(conversation_id, created_at ASC)`
   - `idx_notifications_user_unread`: `notifications(recipient_id, read_at, created_at DESC)`
   - `idx_user_blocks_composite`: `user_blocks(blocker_id, blocked_id)`
   - `idx_friendships_user_status`: `friendships(user_id, status)`
