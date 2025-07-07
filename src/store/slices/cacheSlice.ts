
import { StateCreator } from 'zustand';
import { AppStore } from '../index';

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface CacheSlice {
  // State
  cache: Record<string, CacheEntry>;
  
  // Actions
  getCachedData: <T>(key: string) => T | null;
  setCachedData: (key: string, data: any, ttl?: number) => void;
  invalidateCache: (pattern?: string) => void;
  clearCache: () => void;
  isExpired: (key: string) => boolean;
  cleanupExpiredCache: () => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const createCacheSlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  CacheSlice
> = (set, get) => ({
  // Initial state
  cache: {},

  // Actions
  getCachedData: <T>(key: string): T | null => {
    const { cache } = get();
    const entry = cache[key];
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      set((state) => {
        delete state.cache[key];
      });
      return null;
    }
    
    return entry.data as T;
  },

  setCachedData: (key: string, data: any, ttl = DEFAULT_TTL) => {
    const now = Date.now();
    const entry: CacheEntry = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };
    
    set((state) => {
      state.cache[key] = entry;
    });
  },

  invalidateCache: (pattern?: string) => {
    set((state) => {
      if (pattern) {
        // Remove cache entries matching the pattern
        Object.keys(state.cache).forEach(key => {
          if (key.includes(pattern)) {
            delete state.cache[key];
          }
        });
      } else {
        // Clear all cache
        state.cache = {};
      }
    });
  },

  clearCache: () => {
    set((state) => {
      state.cache = {};
    });
  },

  isExpired: (key: string): boolean => {
    const { cache } = get();
    const entry = cache[key];
    return !entry || Date.now() > entry.expiresAt;
  },

  cleanupExpiredCache: () => {
    const now = Date.now();
    set((state) => {
      Object.keys(state.cache).forEach(key => {
        if (state.cache[key].expiresAt < now) {
          delete state.cache[key];
        }
      });
    });
  },
});

// Auto-cleanup expired cache every 10 minutes
setInterval(() => {
  // This will only work if store is already initialized
  try {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store?.getState?.()?.cleanupExpiredCache) {
      store.getState().cleanupExpiredCache();
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
}, 10 * 60 * 1000);
