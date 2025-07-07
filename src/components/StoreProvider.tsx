
import React, { useEffect } from 'react';
import { useStoreInitialization } from '@/hooks/useStore';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  useStoreInitialization();
  
  return <>{children}</>;
};
