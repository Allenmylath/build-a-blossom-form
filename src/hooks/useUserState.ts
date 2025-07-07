
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface UserStateManager {
  user: User | null;
  loading: boolean;
  isStable: boolean;
}

export const useUserState = (initialUser: User | null, initialLoading: boolean = false) => {
  const [userState, setUserState] = useState<UserStateManager>({
    user: initialUser,
    loading: initialLoading,
    isStable: false
  });
  
  const lastUserIdRef = useRef<string | null>(null);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateCountRef = useRef(0);

  const updateUser = (user: User | null, loading: boolean = false) => {
    const currentUserId = user?.id || null;
    const lastUserId = lastUserIdRef.current;
    
    // Only update if the user actually changed
    if (currentUserId !== lastUserId) {
      console.log('User state changing from', lastUserId, 'to', currentUserId);
      
      lastUserIdRef.current = currentUserId;
      updateCountRef.current += 1;
      
      setUserState({
        user,
        loading,
        isStable: false
      });
      
      // Clear existing stability timer
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
      
      // Set stability timer - user is considered stable after 500ms of no changes
      stabilityTimerRef.current = setTimeout(() => {
        console.log('User state stabilized for user:', currentUserId);
        setUserState(prev => ({
          ...prev,
          loading: false,
          isStable: true
        }));
      }, 500);
    } else if (loading !== userState.loading) {
      // Only update loading state if it changed
      setUserState(prev => ({
        ...prev,
        loading
      }));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, []);

  return {
    ...userState,
    updateUser,
    updateCount: updateCountRef.current
  };
};
