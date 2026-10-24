/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Nilpha Social — Supabase Client Architecture (Part 9)
 *
 * Vite Compiler Rules:
 * Vite performs static AST string-replacement at build time for expressions starting with `import.meta.env.VITE_*`.
 * Direct static member access is mandatory. Dynamic lookup via `import.meta.env[key]` or `env?.VITE_*`
 * can fail to inline values in production builds.
 */

// 1. Direct static reads for Vite AST replacement (with process.env fallback for Node/testing)
const rawUrl = (
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : typeof process !== 'undefined' && process.env
    ? process.env.VITE_SUPABASE_URL
    : ''
) as string | undefined;

const rawAnonKey = (
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : typeof process !== 'undefined' && process.env
    ? process.env.VITE_SUPABASE_ANON_KEY
    : ''
) as string | undefined;

const rawPublishableKey = (
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    : typeof process !== 'undefined' && process.env
    ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    : ''
) as string | undefined;

// Normalize values
const supabaseUrl = (rawUrl || '').trim();
// Support both standard VITE_SUPABASE_ANON_KEY and modern VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseKey = (rawAnonKey || rawPublishableKey || '').trim();

// Placeholders detection (users copying .env.example verbatim without replacing)
const isUrlPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-ref') ||
  supabaseUrl.includes('your-project-id') ||
  supabaseUrl.includes('example.supabase.co') ||
  supabaseUrl.includes('MY_SUPABASE_URL');

const isKeyPlaceholder =
  !supabaseKey ||
  supabaseKey.includes('your-public-client-key') ||
  supabaseKey.includes('your-anon-key') ||
  supabaseKey.includes('MY_ANON_KEY') ||
  supabaseKey.includes('placeholder');

// Protocol and format validation
const isUrlFormatValid =
  Boolean(supabaseUrl) &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost') || supabaseUrl.startsWith('http://127.0.0.1'));

// Service-role key leak detection (never allowed in browser bundles)
function checkIsServiceRoleKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) {
    return true;
  }
  // Try inspecting JWT payload for role === 'service_role'
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const payloadStr = typeof atob === 'function' ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      if (payload && payload.role === 'service_role') {
        return true;
      }
    }
  } catch {
    // If JWT cannot be parsed, rely on prefix checks
  }
  return false;
}

const isServiceRoleKeyDetected = checkIsServiceRoleKey(supabaseKey);

/**
 * Determine whether Supabase is legitimately configured with valid, non-placeholder credentials.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseKey &&
  isUrlFormatValid &&
  !isUrlPlaceholder &&
  !isKeyPlaceholder &&
  !isServiceRoleKeyDetected
);

// Singleton client instance
let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nilpha_social_auth_session',
      },
    });
  } catch (err) {
    console.error('[Nilpha Social] Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

/**
 * Shared Supabase client instance (or null if not configured).
 * Never throws on import to ensure public routes render without white-screening.
 */
export const supabase = clientInstance;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  invalidReasons: string[];
  isPlaceholder: boolean;
  isServiceRoleKey: boolean;
  urlHost: string | null;
  keyType: 'anon' | 'publishable' | 'none';
}

/**
 * Returns a diagnostic report of the Supabase configuration status.
 * Safe for display in UI notices without leaking actual key values.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const missing: string[] = [];
  const invalidReasons: string[] = [];

  if (!supabaseUrl) {
    missing.push('VITE_SUPABASE_URL');
  } else if (!isUrlFormatValid) {
    invalidReasons.push('VITE_SUPABASE_URL must start with "https://" (e.g., https://xyz.supabase.co)');
  } else if (isUrlPlaceholder) {
    invalidReasons.push('VITE_SUPABASE_URL contains template placeholder ("your-project-ref"). Replace with your real Project URL.');
  }

  if (!supabaseKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  } else if (isKeyPlaceholder) {
    invalidReasons.push('VITE_SUPABASE_ANON_KEY contains template placeholder ("your-public-client-key"). Replace with your real public key.');
  } else if (isServiceRoleKeyDetected) {
    invalidReasons.push('CRITICAL: A Supabase "service_role" secret key was detected! Never expose service_role in frontend environment variables. Use the "anon" or "publishable" key.');
  }

  let urlHost: string | null = null;
  try {
    if (supabaseUrl && isUrlFormatValid) {
      urlHost = new URL(supabaseUrl).host;
    }
  } catch {
    urlHost = null;
  }

  const keyType: 'anon' | 'publishable' | 'none' = rawAnonKey
    ? 'anon'
    : rawPublishableKey
    ? 'publishable'
    : 'none';

  return {
    isConfigured: missing.length === 0 && invalidReasons.length === 0,
    missingKeys: missing,
    invalidReasons,
    isPlaceholder: isUrlPlaceholder || isKeyPlaceholder,
    isServiceRoleKey: isServiceRoleKeyDetected,
    urlHost,
    keyType,
  };
}
