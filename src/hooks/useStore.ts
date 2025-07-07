
import { useEffect } from 'react';
import { useAppStore } from '@/store';

// Simplified hook - the actual initialization is now handled in StoreProvider
export const useStoreInitialization = () => {
  const { user, authLoading } = useAppStore();
  
  useEffect(() => {
    console.log('useStoreInitialization - Auth state:', { user: !!user, authLoading });
  }, [user, authLoading]);
};
