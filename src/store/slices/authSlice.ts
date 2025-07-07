
import { StateCreator } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppStore } from '../index';

export interface AuthSlice {
  // State
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  isStable: boolean;
  lastAuthEvent: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateAuthState: (user: User | null, session: Session | null) => void;
  initializeAuth: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial state
  user: null,
  session: null,
  authLoading: true,
  isStable: false,
  lastAuthEvent: null,

  // Actions
  signIn: async (email: string, password: string) => {
    set((state) => {
      state.authLoading = true;
    });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set((state) => {
          state.authLoading = false;
        });
        return { error };
      }

      // Auth state will be updated via onAuthStateChange
      return { error: null };
    } catch (error) {
      set((state) => {
        state.authLoading = false;
      });
      return { error };
    }
  },

  signOut: async () => {
    set((state) => {
      state.authLoading = true;
    });

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }

      // Clear all app state on signout
      set((state) => {
        state.user = null;
        state.session = null;
        state.authLoading = false;
        state.isStable = false;
        state.savedForms = [];
        state.currentForm = null;
        state.fields = [];
        state.submissions = [];
        state.submissionsPagination = { page: 1, limit: 50, total: 0, hasMore: false };
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set((state) => {
        state.authLoading = false;
      });
    }
  },

  updateAuthState: (user: User | null, session: Session | null) => {
    const currentUserId = get().user?.id;
    const newUserId = user?.id;
    
    // Only update if user actually changed
    if (currentUserId !== newUserId) {
      console.log('Auth state changing from', currentUserId, 'to', newUserId);
      
      set((state) => {
        state.user = user;
        state.session = session;
        state.authLoading = false;
        state.isStable = false;
        state.lastAuthEvent = `${Date.now()}-${newUserId || 'null'}`;
      });

      // Clear forms data when user changes
      if (currentUserId !== newUserId) {
        set((state) => {
          state.savedForms = [];
          state.currentForm = null;
          state.fields = [];
          state.submissions = [];
          state.submissionsPagination = { page: 1, limit: 50, total: 0, hasMore: false };
        });
      }

      // Set user as stable after a delay
      setTimeout(() => {
        set((state) => {
          state.isStable = true;
        });
        
        // Trigger forms fetch when user becomes stable
        if (user) {
          get().fetchForms();
        }
      }, 500);
    } else {
      // Just update loading state if user didn't change
      set((state) => {
        state.authLoading = false;
      });
    }
  },

  initializeAuth: () => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, 'User:', session?.user?.id);
        get().updateAuthState(session?.user ?? null, session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      get().updateAuthState(session?.user ?? null, session);
    });

    // Store subscription for cleanup
    (get() as any).authSubscription = subscription;
  },

  setAuthLoading: (loading: boolean) => {
    set((state) => {
      state.authLoading = loading;
    });
  },
});
