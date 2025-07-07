
import { StateCreator } from 'zustand';
import { AppStore } from '../index';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'form' | 'submission' | 'field';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineSlice {
  // State
  isOnline: boolean;
  offlineQueue: OfflineOperation[];
  syncInProgress: boolean;
  
  // Actions
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncOfflineOperations: () => Promise<void>;
  clearOfflineQueue: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  removeOperation: (operationId: string) => void;
  retryFailedOperations: () => Promise<void>;
}

export const createOfflineSlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  OfflineSlice
> = (set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  offlineQueue: [],
  syncInProgress: false,

  // Actions
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    set((state) => {
      state.offlineQueue.push(newOperation);
    });
    
    // Try to sync immediately if online
    if (get().isOnline) {
      setTimeout(() => get().syncOfflineOperations(), 0);
    }
  },

  syncOfflineOperations: async () => {
    const { offlineQueue, isOnline, syncInProgress } = get();
    
    if (!isOnline || syncInProgress || offlineQueue.length === 0) {
      return;
    }
    
    set((state) => {
      state.syncInProgress = true;
    });
    
    const operations = [...offlineQueue];
    
    for (const operation of operations) {
      try {
        await processOfflineOperation(operation, get);
        
        // Remove successful operation
        set((state) => {
          state.offlineQueue = state.offlineQueue.filter(op => op.id !== operation.id);
        });
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
        
        // Increment retry count
        set((state) => {
          const op = state.offlineQueue.find(o => o.id === operation.id);
          if (op) {
            op.retryCount++;
            
            // Remove if max retries exceeded
            if (op.retryCount >= op.maxRetries) {
              state.offlineQueue = state.offlineQueue.filter(o => o.id !== operation.id);
            }
          }
        });
      }
    }
    
    set((state) => {
      state.syncInProgress = false;
    });
  },

  clearOfflineQueue: () => {
    set((state) => {
      state.offlineQueue = [];
    });
  },

  setOnlineStatus: (isOnline: boolean) => {
    set((state) => {
      state.isOnline = isOnline;
    });
    
    // Try to sync when coming back online
    if (isOnline) {
      setTimeout(() => get().syncOfflineOperations(), 1000);
    }
  },

  removeOperation: (operationId: string) => {
    set((state) => {
      state.offlineQueue = state.offlineQueue.filter(op => op.id !== operationId);
    });
  },

  retryFailedOperations: async () => {
    const { offlineQueue } = get();
    const failedOperations = offlineQueue.filter(op => op.retryCount > 0);
    
    for (const operation of failedOperations) {
      set((state) => {
        const op = state.offlineQueue.find(o => o.id === operation.id);
        if (op) {
          op.retryCount = 0; // Reset retry count
        }
      });
    }
    
    await get().syncOfflineOperations();
  },
});

// Helper function to process offline operations
async function processOfflineOperation(operation: OfflineOperation, getState: () => AppStore) {
  const { saveForm, deleteForm } = getState();
  
  switch (operation.entity) {
    case 'form':
      if (operation.type === 'create' || operation.type === 'update') {
        await saveForm(operation.data.formData, operation.data.fields, operation.data.existingForm);
      } else if (operation.type === 'delete') {
        await deleteForm(operation.data.formId);
      }
      break;
    
    case 'submission':
      // Handle submission operations
      break;
    
    case 'field':
      // Handle field operations
      break;
    
    default:
      throw new Error(`Unknown entity type: ${operation.entity}`);
  }
}

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Get the store instance and update online status
    try {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store?.getState?.()?.setOnlineStatus) {
        store.getState().setOnlineStatus(true);
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  });
  
  window.addEventListener('offline', () => {
    try {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store?.getState?.()?.setOnlineStatus) {
        store.getState().setOnlineStatus(false);
      }
    } catch (error) {
      console.error('Error updating offline status:', error);
    }
  });
}
