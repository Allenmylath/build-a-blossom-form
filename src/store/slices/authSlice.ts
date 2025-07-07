
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

let updateAuthStateTimeout: NodeJS.Timeout | null = null;

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
    console.log('SignIn called with email:', email);
    set({ authLoading: true, authError: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', !!data.user);
      set({
        user: data.user,
        session: data.session,
        authLoading: false,
        isStable: true,
      });

      // Defer subscription fetch to prevent blocking
      const state = get() as any;
      if (state.fetchUserSubscription) {
        setTimeout(() => {
          state.fetchUserSubscription();
        }, 100);
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      console.error('Sign in failed:', errorMessage);
      set({
        authError: errorMessage,
        authLoading: false,
        isStable: true,
      });
      return { error: errorMessage };
    }
  },

  signOut: async () => {
    console.log('SignOut called');
    set({ authLoading: true });
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({
        user: null,
        session: null,
        authLoading: false,
        authError: null,
        isStable: true,
      });

      // Reset plan state on sign out
      const state = get() as any;
      if (state.resetPlanState) {
        state.resetPlanState();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('Sign out error:', errorMessage);
      set({
        authError: errorMessage,
        authLoading: false,
        isStable: true,
      });
      throw error;
    }
  },

  updateAuthState: (user: User | null, session: Session | null) => {
    // Debounce auth state updates to prevent infinite loops
    if (updateAuthStateTimeout) {
      clearTimeout(updateAuthStateTimeout);
    }
    
    updateAuthStateTimeout = setTimeout(() => {
      console.log('UpdateAuthState called:', { user: !!user, session: !!session });
      const currentState = get() as any;
      const currentUserId = currentState.user?.id;
      const newUserId = user?.id;
      const eventId = `${Date.now()}-${newUserId || 'null'}`;
      
      // Prevent duplicate updates
      if (currentState.lastAuthEvent === eventId) {
        console.log('Skipping duplicate auth state update');
        return;
      }
      
      // Only update if user actually changed
      if (currentUserId !== newUserId) {
        console.log('Auth state changing from', currentUserId, 'to', newUserId);
        
        set({
          user: user,
          session: session,
          authLoading: false,
          isStable: true,
          lastAuthEvent: eventId,
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

        // Defer forms fetch to prevent infinite loops
        if (user) {
          const state = get() as any;
          if (state.fetchForms) {
            setTimeout(() => {
              // Double-check user is still valid before fetching
              const latestState = get() as any;
              if (latestState.user && latestState.isStable) {
                state.fetchForms();
              }
            }, 200);
          }
        }
      } else {
        // Just update loading state if user didn't change
        set({
          authLoading: false,
          isStable: true,
          lastAuthEvent: eventId,
        });
      }
    }, 50); // 50ms debounce
  },

  initializeAuth: async () => {
    console.log('InitializeAuth called');
    set({ authLoading: true, isStable: false });
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        set({
          authError: error.message,
          authLoading: false,
          isStable: true,
        });
        return;
      }

      console.log('Initial session:', !!session?.user);
      set({
        user: session?.user || null,
        session: session || null,
        authLoading: false,
        isStable: true,
      });

      // Defer subscription fetch to prevent blocking
      if (session?.user) {
        const state = get() as any;
        if (state.fetchUserSubscription) {
          setTimeout(() => {
            state.fetchUserSubscription();
          }, 100);
        }
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        
        const state = get() as any;
        state.updateAuthState(session?.user || null, session || null);

        if (event === 'SIGNED_IN' && session?.user) {
          if (state.fetchUserSubscription) {
            setTimeout(() => {
              state.fetchUserSubscription();
            }, 100);
          }
        } else if (event === 'SIGNED_OUT') {
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
        isStable: true,
      });
    }
  },

  setAuthLoading: (loading: boolean) => {
    console.log('SetAuthLoading called:', loading);
    set({
      authLoading: loading,
    });
  },
});
