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
  AuthSlice & { fetchUserSubscription?: () => Promise<void> },
  [],
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
    set({ authLoading: true, authError: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        authLoading: false,
      });

      // Fetch user subscription after successful sign in
      const fetchUserSubscription = (get as any).fetchUserSubscription;
      if (fetchUserSubscription) {
        await fetchUserSubscription();
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      set({
        authError: errorMessage,
        authLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ authLoading: true });
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({
        user: null,
        session: null,
        authLoading: false,
        authError: null,
      });

      // Reset plan state on sign out
      const resetPlanState = (get as any).resetPlanState;
      if (resetPlanState) {
        resetPlanState();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      set({
        authError: errorMessage,
        authLoading: false,
      });
      throw error;
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

  initializeAuth: async () => {
    set({ authLoading: true });
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        set({
          authError: error.message,
          authLoading: false,
        });
        return;
      }

      set({
        user: session?.user || null,
        session: session || null,
        authLoading: false,
      });

      // Fetch user subscription if user is authenticated
      if (session?.user) {
        const fetchUserSubscription = (get as any).fetchUserSubscription;
        if (fetchUserSubscription) {
          await fetchUserSubscription();
        }
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        
        set({
          user: session?.user || null,
          session: session || null,
        });

        if (event === 'SIGNED_IN' && session?.user) {
          const fetchUserSubscription = (get as any).fetchUserSubscription;
          if (fetchUserSubscription) {
            await fetchUserSubscription();
          }
        } else if (event === 'SIGNED_OUT') {
          const resetPlanState = (get as any).resetPlanState;
          if (resetPlanState) {
            resetPlanState();
          }
        }
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({
        authError: error instanceof Error ? error.message : 'Auth initialization failed',
        authLoading: false,
      });
    }
  },

  setAuthLoading: (loading: boolean) => {
    set((state) => {
      state.authLoading = loading;
    });
  },
});
