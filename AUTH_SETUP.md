# Nilpha Social — Authentication Setup Guide (Part 2)

This document provides instructions for setting up **Supabase Auth** and configuring real user authentication, session persistence, and email verification for Nilpha Social.

---

## 1. Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project** and configure your organization and project name (e.g., `nilpha-social-prod`).
3. Set a strong database password and select a region close to your primary audience (e.g., Singapore `ap-southeast-1` or Mumbai `ap-south-1` for optimal latency in Bangladesh).
4. Wait for database provisioning to complete (~1-2 minutes).

---

## 2. Obtain Client API Credentials

In the Supabase Dashboard:
1. Navigate to **Project Settings** (gear icon) -> **API**.
2. Copy the following two parameters:
   - **Project URL**: e.g., `https://your-project-id.supabase.co`
   - **Project API Keys**: Copy the **`anon` / `public`** key.
   *(⚠️ Warning: Never copy or expose the `service_role` key in frontend `.env` or client code).*

---

## 3. Configure Local Environment Variables

Create or update your local `.env` file from `.env.example`:

```bash
# Add your Supabase credentials:
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key-here"
```

Restart the development server if needed:
```bash
npm run dev
```

---

## 4. Configure Authentication & URL Redirects

In the Supabase Dashboard:
1. Navigate to **Authentication** -> **URL Configuration**.
2. **Site URL**: Set to your hosted app URL (e.g., `https://ais-dev-...run.app` or `http://localhost:3000`).
3. **Redirect URLs**: Add the following routes for password recovery and email verification callbacks:
   - `https://your-app-domain.com/reset-password`
   - `https://your-app-domain.com/verify-email`
   - `http://localhost:3000/reset-password` (for local development)
   - `http://localhost:3000/verify-email` (for local development)

---

## 5. Configure Email Confirmation

In the Supabase Dashboard:
1. Navigate to **Authentication** -> **Providers** -> **Email**.
2. **Enable Email provider**: Ensure it is turned ON.
3. **Confirm email**:
   - If enabled: Users will receive a confirmation email upon registration before being able to log in. The application handles this state gracefully by displaying the `/verify-email` confirmation notice.
   - If disabled (for instant testing): Users will be signed in immediately after registration without waiting for an email.
4. **Customize Email Templates**:
   - Navigate to **Authentication** -> **Email Templates**.
   - You can localize the "Confirm signup" and "Reset Password" subject and body to Bengali or English with Nilpha Social branding.

---

## 6. Authentication Flows Implemented

The application implements full client-side handlers connected to the official `@supabase/supabase-js` client:

- **Sign In (`/login`)**:
  - Real email and password authentication (`supabase.auth.signInWithPassword`).
  - Show/hide password control.
  - Safe error handling without revealing internal database errors.
  - Automatic session restoration on reload.
  - Redirection to `/profile` or previously requested protected route.

- **Sign Up (`/register`)**:
  - Full name / display name.
  - Normalized unique username format (`^[a-z0-9_]{3,30}$`).
  - Email format validation and password matching.
  - Required consent checkbox for Terms & Privacy Policy.
  - Passes user metadata (`username`, `display_name`, `preferred_language`) to `supabase.auth.signUp`.
  - Idempotent profile creation trigger in PostgreSQL.

- **Forgot Password (`/forgot-password`)**:
  - Sends recovery email via `supabase.auth.resetPasswordForEmail` with redirect to `/reset-password`.

- **Reset Password (`/reset-password`)**:
  - Handles recovery session and calls `supabase.auth.updateUser({ password })`.

- **Sign Out**:
  - Clears Supabase session and application state. Available from the TopBar account menu and Settings page.

---

## 7. Graceful Fallback Mode

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set in the environment:
- The application will **not crash**.
- Public pages (Home feed, Videos, Communities, Games, Help) remain fully browseable.
- Auth pages display a clear, dismissible configuration notice (`SupabaseConfigNotice`) stating that credentials are required.
- The app refuses to fake login states, preserving trust and security.
