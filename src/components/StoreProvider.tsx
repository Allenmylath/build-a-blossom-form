
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);
  const { initializeAuth, isStable } = useAppStore();
  
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current || isInitialized) {
      return;
    }
    
    console.log('StoreProvider initializing auth...');
    initializingRef.current = true;
    
    const initAuth = async () => {
      try {
        await initializeAuth();
        console.log('Auth initialization completed');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsInitialized(true); // Still set to true to avoid infinite loading
      } finally {
        initializingRef.current = false;
      }
    };
    
    initAuth();
  }, []); // Empty dependency array - only run once
  
  if (!isInitialized || !isStable) {
    console.log('StoreProvider still initializing...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }
  
  console.log('StoreProvider rendering children');
  return <>{children}</>;
};
