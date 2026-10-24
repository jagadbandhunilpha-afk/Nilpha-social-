# NILPHA SOCIAL — VERCEL DEPLOYMENT & SUPABASE CONFIGURATION GUIDE (PART 9)

This guide provides step-by-step instructions for connecting real Supabase services to Nilpha Social deployed on **Vercel**, fixing environment variable errors, and verifying production authentication and database connectivity.

---

## 1. Why Did the Configuration Warning Appear on Vercel?

When deploying a **Vite + React Single Page Application (SPA)** to Vercel, client-side code cannot read dynamic runtime variables from the server environment. Instead, Vite inlines variables starting with `VITE_*` into the compiled JavaScript bundle **at build time** (`vite build`).

The configuration notice appears on Vercel for one of these reasons:
1. **Missing Variables in Vercel**: The variables were configured only in a local `.env` file or local machine, but not yet added in the Vercel Dashboard's Environment Variables tab.
2. **Missing Redeployment (Most Common)**: Variables were added in Vercel *after* an existing deployment was built. Because Vite variables are baked into static assets during compilation, Vercel must re-run the build via **"Redeploy"** for the client bundle to receive the keys.
3. **Variable Name Mismatch**: Newer Supabase projects display "Publishable key" in their UI. Nilpha Social supports both standard `VITE_SUPABASE_ANON_KEY` and modern `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. **Placeholder Values**: Pasting template values like `https://your-project-ref.supabase.co` without replacing them with your actual Supabase project reference.

---

## 2. Step-by-Step Setup: Connecting Supabase to Vercel

Follow these 11 exact steps:

### Step 1: Open the Supabase Dashboard
Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and log in.

### Step 2: Select the Correct Project
From your organization's dashboard, click on your Nilpha Social project (e.g., `nilpha-social-prod`).

### Step 3: Find the Project URL
1. In the left-hand navigation sidebar, click the **Settings (gear icon ⚙️)**.
2. Under **Project Settings**, click **API**.
3. In the **Project URL** box, locate your URL:
   ```text
   https://[your-project-ref].supabase.co
   ```
4. Click the **Copy** button.

### Step 4: Find the Project Public Client Key
On the same **API** settings page, look under **Project API Keys**:
- Locate the **`anon` / `public`** key (starts with `eyJhbGciOi...` or publishable format).
- Click **Copy**.
- ⚠️ **CRITICAL SECURITY RULE:** Never copy or use the `service_role` secret key! The `service_role` key bypasses Row Level Security (RLS) and must **NEVER** be placed in frontend environment variables.

### Step 5: Open the Vercel Dashboard
Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and sign in.

### Step 6: Select the Nilpha Social Project
Click on your Nilpha Social project from the project list.

### Step 7: Open Settings → Environment Variables
1. In the project top navigation, click **Settings**.
2. In the left sidebar, click **Environment Variables**.

### Step 8: Add the Required Environment Variables
Add the two variables expected by the frontend:

#### Variable 1:
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://your-project-ref.supabase.co` (Pasted from Step 3)
- **Environments:** Check **Production**, **Preview**, and **Development**.

#### Variable 2:
- **Key:** `VITE_SUPABASE_ANON_KEY`
  *(Note: `VITE_SUPABASE_PUBLISHABLE_KEY` is also fully recognized by Nilpha Social)*
- **Value:** Your public client key (Pasted from Step 4)
- **Environments:** Check **Production**, **Preview**, and **Development**.

### Step 9: Verify Environment Target Selection
Ensure that the checkbox for **Production** is selected so that your live production domain receives these variables during builds.

### Step 10: Save the Settings
Click **Save** for each variable. Confirm that both variables are listed in your Environment Variables table.

### Step 11: Redeploy the Application
Because Vite embeds environment variables at build time, saving variables alone will not update already-deployed bundles. You must trigger a new build:
1. In the Vercel project top navigation, click **Deployments**.
2. Find the topmost (current) deployment.
3. Click the three horizontal dots (**...**) on the right side of that deployment.
4. Select **Redeploy**.
5. When prompted, uncheck "Use existing Build Cache" (or proceed with Redeploy) to ensure a clean compilation.
6. Wait for the build and deployment to complete (~1 minute).
7. Visit your live site (e.g. `https://your-project.vercel.app/login`). The configuration warning will be gone!

---

## 3. Verifying Public Key & Project URL Match

To verify that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong to the same project:
1. Look at your Project URL: `https://[project-ref].supabase.co`. The subdomain (e.g., `abcdefghijklmn`) is your unique project reference.
2. In standard Supabase `anon` JWT keys, the payload contains `"ref": "[project-ref]"`.
3. If the URL and Key come from two different projects, the Supabase API will return HTTP 401 Unauthorized errors during sign-in or data fetching. Always copy both from the **same** project's **API** settings tab.

---

## 4. Single Page Application (SPA) Routing on Vercel

In React Router applications, refreshing the browser on `/login`, `/register`, or `/profile` can produce a `404: NOT_FOUND` on Vercel if URL rewrites are missing.

Nilpha Social includes a root `vercel.json` file configuring SPA rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This guarantees that all route paths are served by Vite's `index.html` and handled smoothly by React Router.

---

## 5. Applying Database Migrations to Supabase

For authentication, user profiles, social feeds, wallets, and notifications to function with real data, your Supabase PostgreSQL database must have the project tables and RLS policies created.

If you have not yet applied the SQL migrations to your Supabase project:
1. In the Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Apply the migrations in numerical order from the `supabase/migrations/` directory:
   - `20261021000000_create_profiles_table.sql` (Profiles, auth triggers, avatars storage)
   - `20261021010000_create_feed_tables.sql` (Posts, comments, reactions, bookmarks)
   - `20261021020000_create_relationships_and_communities_tables.sql` (Friends, follows, groups, pages)
   - `20261021030000_create_messaging_calls_streaming_tables.sql` (Messages, WebRTC calls, live streams)
   - `20261022000000_create_games_wallet_rewards_tables.sql` (Demo coin wallet, transactions ledger, challenges)
   - `20261023000000_create_notifications_search_moderation_admin_tables.sql` (Notifications, reports, audit logs, RBAC)
   - `20261024000000_part8_security_hardening_and_indexes.sql` (Search paths, RLS guards, indexes, account deletion)
4. Click **Run** for each migration.

---

## 6. Configuring Supabase Authentication Redirect URLs

To ensure email verification links and password recovery emails redirect to your Vercel deployment:
1. In Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your Vercel production domain:
   ```text
   https://your-project.vercel.app
   ```
3. In **Redirect URLs**, add:
   ```text
   https://your-project.vercel.app/reset-password
   https://your-project.vercel.app/verify-email
   http://localhost:3000/reset-password
   http://localhost:3000/verify-email
   ```
4. Click **Save**.

---

## 7. Verification Checklist

After redeploying on Vercel:
- [x] Open `/login` — the warning banner should no longer be present.
- [x] Test registration with a test email — profile row is created in `public.profiles`.
- [x] Test login — authentication state persists across browser tab refreshes.
- [x] Open `/feed`, `/wallet`, `/messages` — real authenticated queries execute against Supabase with strict Row Level Security.
