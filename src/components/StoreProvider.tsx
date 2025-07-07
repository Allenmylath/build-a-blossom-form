
import React, { useEffect, useState } from 'react';
import { useStoreInitialization } from '@/hooks/useStore';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    console.log('StoreProvider mounting...');
    setIsInitialized(true);
  }, []);
  
  useStoreInitialization();
  
  if (!isInitialized) {
    console.log('StoreProvider not yet initialized');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }
  
  console.log('StoreProvider rendering children');
  return <>{children}</>;
};
