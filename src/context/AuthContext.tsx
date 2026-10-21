import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface SignUpParams {
  email: string;
  password: string;
  username: string;
  displayName: string;
  preferredLanguage?: 'bn' | 'en';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (params: SignUpParams) => Promise<{
    error: AuthError | Error | null;
    needsEmailVerification?: boolean;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null; data?: UserProfile }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch or safely initialize profile from public.profiles
  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    if (!supabase || !isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else if (currentUser) {
        // Idempotent client-side fallback if the DB trigger didn't execute
        const metadata = currentUser.user_metadata || {};
        const fallbackUsername = (metadata.username || `user_${userId.slice(0, 8)}`).toLowerCase();
        const fallbackDisplayName = metadata.display_name || fallbackUsername;
        const fallbackLang = metadata.preferred_language || 'bn';

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: fallbackUsername,
            display_name: fallbackDisplayName,
            preferred_language: fallbackLang,
            account_status: 'active',
            verification_status: 'none',
          })
          .select()
          .single();

        if (!insertError && inserted) {
          setProfile(inserted as UserProfile);
        }
      }
    } catch (err) {
      console.warn('Profile fetch exception:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session restoration
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Initial session error:', error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id, currentSession.user);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error };
  };

  const signUp = async ({
    email,
    password,
    username,
    displayName,
    preferredLanguage = 'bn',
  }: SignUpParams) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    const normalizedUsername = username.trim().toLowerCase();

    // 1. Verify username format before hitting API
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return {
        error: new Error('Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.'),
      };
    }

    // 2. Check if username is already taken in profiles table
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (existingUser) {
        return {
          error: new Error('This username is already taken. Please choose another one.'),
        };
      }
    } catch {
      // Continue to let database unique constraint catch it if table check is restricted
    }

    // 3. Supabase Auth signUp
    const redirectUrl = `${window.location.origin}/verify-email`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: normalizedUsername,
          display_name: displayName.trim(),
          preferred_language: preferredLanguage,
        },
      },
    });

    if (error) {
      return { error };
    }

    // If confirmation is required, user is created but session is null until verified
    const needsEmailVerification = Boolean(data.user && !data.session);

    return {
      error: null,
      needsEmailVerification,
    };
  };

  const signOut = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
      };
    }

    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured.'),
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !isSupabaseConfigured || !user) {
      return {
        error: new Error('Cannot update profile: user is not authenticated or Supabase is not configured.'),
      };
    }

    // Explicitly reject attempting to update protected fields from client
    const sanitizedUpdates = {
      display_name: updates.display_name?.trim(),
      bio: updates.bio !== undefined ? updates.bio?.trim() : undefined,
      preferred_language: updates.preferred_language,
      avatar_url: updates.avatar_url,
    };

    // Remove undefined values
    Object.keys(sanitizedUpdates).forEach(
      (key) => (sanitizedUpdates as Record<string, unknown>)[key] === undefined && delete (sanitizedUpdates as Record<string, unknown>)[key]
    );

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { error };
    }

    if (data) {
      setProfile(data as UserProfile);
    }

    return { error: null, data: data as UserProfile };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
