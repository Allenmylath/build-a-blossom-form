
import { useEffect } from 'react';
import { useAppStore, useAuthActions } from '@/store';

// Custom hook to initialize the store
export const useStoreInitialization = () => {
  const { initializeAuth } = useAuthActions();
  
  useEffect(() => {
    console.log('Initializing store...');
    
    // Initialize auth when the app starts
    try {
      initializeAuth();
      console.log('Auth initialization completed');
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
    
    // Set up store reference for offline handling
    (window as any).__ZUSTAND_STORE__ = useAppStore;
    
    return () => {
      console.log('Cleaning up store initialization');
      // Cleanup auth subscription on unmount
      const state = useAppStore.getState();
      const authSubscription = (state as any).authSubscription;
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
    };
  }, [initializeAuth]);
};

// Wrapper hooks for backward compatibility
export const useSupabaseAuth = () => {
  const { user, session, authLoading: loading } = useAppStore();
  const { signOut } = useAuthActions();
  
  console.log('useSupabaseAuth state:', { user: !!user, session: !!session, loading });
  
  return {
    user,
    session,
    loading,
    signOut,
  };
};

export const useSupabaseForms = (user: any) => {
  const { 
    savedForms, 
    formsLoading: loading, 
    maxFormsReached, 
    isHobbyPlan 
  } = useAppStore();
  
  const { 
    saveForm, 
    deleteForm, 
    fetchForms, 
    refreshSingleForm 
  } = useAppStore();
  
  return {
    savedForms,
    loading,
    saveForm,
    deleteForm,
    refreshForms: fetchForms,
    refreshSingleForm,
    maxFormsReached,
    isHobbyPlan,
  };
};
