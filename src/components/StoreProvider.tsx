
import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { initializeAuth, authLoading } = useAppStore();
  
  useEffect(() => {
    console.log('StoreProvider mounting, initializing auth...');
    
    const initAuth = async () => {
      try {
        initializeAuth();
        // Wait a moment for auth to initialize
        setTimeout(() => {
          console.log('Auth initialization completed, setting initialized to true');
          setIsInitialized(true);
        }, 1000);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsInitialized(true); // Still set to true to avoid infinite loading
      }
    };
    
    initAuth();
  }, [initializeAuth]);
  
  if (!isInitialized) {
    console.log('StoreProvider not yet initialized, showing loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }
  
  console.log('StoreProvider rendering children');
  return <>{children}</>;
};
