
import { useEffect } from 'react';
import { useAuthActions } from '@/store';

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
    
    return () => {
      console.log('Cleaning up store initialization');
    };
  }, [initializeAuth]);
};
