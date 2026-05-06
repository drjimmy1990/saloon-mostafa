import { create } from 'zustand';
import { getSupabaseBrowserClient } from './supabase-browser';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface ClientProfile {
  id: string;
  name: string | null;
  phone: string;
  email: string;
  address: string;
}

interface AuthState {
  user: User | null;
  client: ClientProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshClient: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; address?: string }) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  client: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    
    const supabase = getSupabaseBrowserClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        await get().refreshClient();
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const currentUser = get().user;
      if (session?.user?.id !== currentUser?.id) {
        set({ user: session?.user ?? null });
        if (session?.user) {
          get().refreshClient();
        } else {
          set({ client: null });
        }
      }
    });
  },

  signUp: async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      set({ user: data.user });

      // Link to Client CRM
      try {
        const res = await fetch('/api/auth/link-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authUserId: data.user.id,
            email: email.trim().toLowerCase(),
          }),
        });
        const clientData = await res.json();
        if (clientData.client) {
          set({ client: clientData.client });
        }
      } catch (err) {
        console.error('Failed to link client:', err);
      }
    }

    return { error: null };
  },

  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      set({ user: data.user });

      // Link to Client CRM
      try {
        const res = await fetch('/api/auth/link-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authUserId: data.user.id,
            email: data.user.email || '',
          }),
        });
        const clientData = await res.json();
        if (clientData.client) {
          set({ client: clientData.client });
        }
      } catch (err) {
        console.error('Failed to link client:', err);
      }
    }

    return { error: null };
  },

  logout: async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    set({ user: null, client: null });
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }) => {
    const user = get().user;
    if (!user) return { error: 'Not authenticated' };

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: user.id, ...data }),
      });
      const result = await res.json();
      if (result.client) {
        set({ client: result.client });
      }
      return { error: null };
    } catch (err) {
      console.error('Profile update error:', err);
      return { error: 'Failed to update profile' };
    }
  },

  refreshClient: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const res = await fetch('/api/auth/link-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: user.id,
          email: user.email || '',
        }),
      });
      const data = await res.json();
      if (data.client) {
        set({ client: data.client });
      }
    } catch (err) {
      console.error('Failed to refresh client:', err);
    }
  },
}));
