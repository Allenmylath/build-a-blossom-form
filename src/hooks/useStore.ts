
import { useEffect } from 'react';
import { useAppStore, useAuthActions } from '@/store';

// Custom hook to initialize the store
export const useStoreInitialization = () => {
  const { initializeAuth } = useAuthActions();
  
  useEffect(() => {
    // Initialize auth when the app starts
    initializeAuth();
    
    // Set up store reference for offline handling
    (window as any).__ZUSTAND_STORE__ = useAppStore;
    
    return () => {
      // Cleanup auth subscription on unmount
      const authSubscription = (useAppStore.getState() as any).authSubscription;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [initializeAuth]);
};

// Wrapper hooks for backward compatibility
export const useSupabaseAuth = () => {
  const { user, session, authLoading: loading } = useAppStore();
  const { signOut } = useAuthActions();
  
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
