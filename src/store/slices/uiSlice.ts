
import { StateCreator } from 'zustand';
import { AppStore } from '../index';

export interface DialogState {
  [key: string]: boolean;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface UISlice {
  // State
  dialogs: DialogState;
  loadingStates: LoadingState;
  notifications: NotificationState[];
  selectedItems: string[];
  searchTerm: string;
  
  // Actions
  openDialog: (dialogId: string) => void;
  closeDialog: (dialogId: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  showNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  setSelectedItems: (items: string[]) => void;
  toggleSelectedItem: (item: string) => void;
  setSearchTerm: (term: string) => void;
  clearAllDialogs: () => void;
}

export const createUISlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  UISlice
> = (set, get) => ({
  // Initial state
  dialogs: {},
  loadingStates: {},
  notifications: [],
  selectedItems: [],
  searchTerm: '',

  // Actions
  openDialog: (dialogId: string) => {
    set((state) => {
      state.dialogs[dialogId] = true;
    });
  },

  closeDialog: (dialogId: string) => {
    set((state) => {
      state.dialogs[dialogId] = false;
    });
  },

  setLoading: (key: string, loading: boolean) => {
    set((state) => {
      state.loadingStates[key] = loading;
    });
  },

  showNotification: (notification: Omit<NotificationState, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationState = { ...notification, id };
    
    set((state) => {
      state.notifications.push(newNotification);
    });

    // Auto-remove notification after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, notification.duration || 5000);
  },

  removeNotification: (id: string) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  setSelectedItems: (items: string[]) => {
    set((state) => {
      state.selectedItems = items;
    });
  },

  toggleSelectedItem: (item: string) => {
    set((state) => {
      const index = state.selectedItems.indexOf(item);
      if (index > -1) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(item);
      }
    });
  },

  setSearchTerm: (term: string) => {
    set((state) => {
      state.searchTerm = term;
    });
  },

  clearAllDialogs: () => {
    set((state) => {
      state.dialogs = {};
    });
  },
});
