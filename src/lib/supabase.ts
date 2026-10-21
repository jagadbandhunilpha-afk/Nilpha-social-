import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate configuration
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim().length > 0 &&
  supabaseAnonKey.trim().length > 0 &&
  supabaseUrl.startsWith('http')
);

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nilpha_social_auth_session',
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

/**
 * Returns the Supabase client instance or null if not configured.
 * Never throws on import to prevent crashing public pages when credentials are not yet supplied.
 */
export const supabase = clientInstance;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const missing: string[] = [];
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.trim().length === 0) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  return {
    isConfigured: missing.length === 0,
    missingKeys: missing,
  };
}
