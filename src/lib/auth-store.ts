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
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshClient: () => Promise<void>;
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

  sendOtp: async (phone: string) => {
    const supabase = getSupabaseBrowserClient();
    
    // Ensure phone is in international format
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '962' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  },

  verifyOtp: async (phone: string, token: string) => {
    const supabase = getSupabaseBrowserClient();
    
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '962' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
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
            phone: formattedPhone,
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

  refreshClient: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const res = await fetch('/api/auth/link-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: user.id,
          phone: user.phone || '',
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
