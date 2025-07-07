
import { StateCreator } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthSlice {
  // State
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  authError: string | null;
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
  any,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial state
  user: null,
  session: null,
  authLoading: true,
  authError: null,
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
      const state = get() as any;
      if (state.fetchUserSubscription) {
        await state.fetchUserSubscription();
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      set({
        authError: errorMessage,
        authLoading: false,
      });
      return { error: errorMessage };
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
      const state = get() as any;
      if (state.resetPlanState) {
        state.resetPlanState();
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
    const currentState = get() as any;
    const currentUserId = currentState.user?.id;
    const newUserId = user?.id;
    
    // Only update if user actually changed
    if (currentUserId !== newUserId) {
      console.log('Auth state changing from', currentUserId, 'to', newUserId);
      
      set({
        user: user,
        session: session,
        authLoading: false,
        isStable: false,
        lastAuthEvent: `${Date.now()}-${newUserId || 'null'}`,
      });

      // Clear forms data when user changes
      if (currentUserId !== newUserId) {
        const state = get() as any;
        if (state.savedForms !== undefined) {
          set({
            savedForms: [],
            currentForm: null,
            fields: [],
            submissions: [],
            submissionsPagination: { page: 1, limit: 50, total: 0, hasMore: false },
          });
        }
      }

      // Set user as stable after a delay
      setTimeout(() => {
        set({
          isStable: true,
        });
        
        // Trigger forms fetch when user becomes stable
        if (user) {
          const state = get() as any;
          if (state.fetchForms) {
            state.fetchForms();
          }
        }
      }, 500);
    } else {
      // Just update loading state if user didn't change
      set({
        authLoading: false,
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
        const state = get() as any;
        if (state.fetchUserSubscription) {
          await state.fetchUserSubscription();
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
          const state = get() as any;
          if (state.fetchUserSubscription) {
            await state.fetchUserSubscription();
          }
        } else if (event === 'SIGNED_OUT') {
          const state = get() as any;
          if (state.resetPlanState) {
            state.resetPlanState();
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
    set({
      authLoading: loading,
    });
  },
});
