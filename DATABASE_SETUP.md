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

