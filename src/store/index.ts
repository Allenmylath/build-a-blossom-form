
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createFormsSlice, FormsSlice } from './slices/formsSlice';
import { createSubmissionsSlice, SubmissionsSlice } from './slices/submissionsSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createCacheSlice, CacheSlice } from './slices/cacheSlice';
import { createOfflineSlice, OfflineSlice } from './slices/offlineSlice';
import { createUserPlanSlice, UserPlanSlice } from './slices/userPlanSlice';

export interface AppStore extends 
  AuthSlice,
  FormsSlice,
  SubmissionsSlice,
  UISlice,
  CacheSlice,
  OfflineSlice,
  UserPlanSlice {}

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      immer((...a) => ({
        ...createAuthSlice(...a),
        ...createFormsSlice(...a),
        ...createSubmissionsSlice(...a),
        ...createUISlice(...a),
        ...createCacheSlice(...a),
        ...createOfflineSlice(...a),
        ...createUserPlanSlice(...a),
      }))
    ),
    { name: 'form-builder-store' }
  )
);

// Stable selectors for optimized re-renders - use shallow comparison
export const useAuthState = () => useAppStore((state) => ({
  user: state.user,
  session: state.session,
  loading: state.authLoading,
  isAuthenticated: !!state.user,
}), (a, b) => 
  a.user?.id === b.user?.id && 
  a.loading === b.loading && 
  a.isAuthenticated === b.isAuthenticated
);

export const useFormsState = () => useAppStore((state) => ({
  savedForms: state.savedForms,
  currentForm: state.currentForm,
  fields: state.fields,
  isLoading: state.formsLoading,
}), (a, b) => 
  a.savedForms.length === b.savedForms.length &&
  a.currentForm?.id === b.currentForm?.id &&
  a.fields.length === b.fields.length &&
  a.isLoading === b.isLoading
);

export const useSubmissionsState = () => useAppStore((state) => ({
  submissions: state.submissions,
  pagination: state.submissionsPagination,
  analytics: state.submissionsAnalytics,
  isLoading: state.submissionsLoading,
}));

export const useUIState = () => useAppStore((state) => ({
  dialogs: state.dialogs,
  notifications: state.notifications,
  loadingStates: state.loadingStates,
  selectedItems: state.selectedItems,
}));

export const useUserPlanState = () => useAppStore((state) => ({
  userSubscription: state.userSubscription,
  planLimits: state.planLimits,
  planLoading: state.planLoading,
  planError: state.planError,
}), (a, b) => 
  a.userSubscription?.plan_type === b.userSubscription?.plan_type &&
  a.planLimits.maxForms === b.planLimits.maxForms &&
  a.planLoading === b.planLoading
);

export const useAuthActions = () => useAppStore((state) => ({
  signIn: state.signIn,
  signOut: state.signOut,
  updateAuthState: state.updateAuthState,
  initializeAuth: state.initializeAuth,
}));

export const useFormsActions = () => useAppStore((state) => ({
  fetchForms: state.fetchForms,
  saveForm: state.saveForm,
  deleteForm: state.deleteForm,
  loadForm: state.loadForm,
  updateCurrentForm: state.updateCurrentForm,
  addField: state.addField,
  updateField: state.updateField,
  deleteField: state.deleteField,
  moveField: state.moveField,
}));

export const useSubmissionsActions = () => useAppStore((state) => ({
  fetchSubmissions: state.fetchSubmissions,
  fetchSubmissionPage: state.fetchSubmissionPage,
  refreshSubmissions: state.refreshSubmissions,
  exportSubmissions: state.exportSubmissions,
}));

export const useUIActions = () => useAppStore((state) => ({
  openDialog: state.openDialog,
  closeDialog: state.closeDialog,
  showNotification: state.showNotification,
  setLoading: state.setLoading,
  setSelectedItems: state.setSelectedItems,
}));

export const useCacheActions = () => useAppStore((state) => ({
  invalidateCache: state.invalidateCache,
  clearCache: state.clearCache,
  getCachedData: state.getCachedData,
  setCachedData: state.setCachedData,
}));

export const useOfflineActions = () => useAppStore((state) => ({
  queueOperation: state.queueOperation,
  syncOfflineOperations: state.syncOfflineOperations,
  clearOfflineQueue: state.clearOfflineQueue,
}));

export const useUserPlanActions = () => useAppStore((state) => ({
  fetchUserSubscription: state.fetchUserSubscription,
  updateUserPlan: state.updateUserPlan,
  checkFeatureAccess: state.checkFeatureAccess,
  checkFormLimit: state.checkFormLimit,
  checkSubmissionLimit: state.checkSubmissionLimit,
  checkKnowledgeBaseLimit: state.checkKnowledgeBaseLimit,
  getPlanDisplayName: state.getPlanDisplayName,
  getPlanColor: state.getPlanColor,
  isFeatureRestricted: state.isFeatureRestricted,
  resetPlanState: state.resetPlanState,
}));
