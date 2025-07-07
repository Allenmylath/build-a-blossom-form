
import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authStateChangeCountRef = useRef(0);
  const lastAuthEventRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        authStateChangeCountRef.current += 1;
        const changeId = `${event}-${session?.user?.id || 'null'}-${authStateChangeCountRef.current}`;
        
        // Prevent duplicate rapid-fire events
        if (lastAuthEventRef.current === changeId) {
          console.log('Duplicate auth event ignored:', event, session?.user?.id);
          return;
        }
        
        lastAuthEventRef.current = changeId;
        console.log('Auth state change:', event, 'User:', session?.user?.id, 'Change #:', authStateChangeCountRef.current);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut
  };
};
