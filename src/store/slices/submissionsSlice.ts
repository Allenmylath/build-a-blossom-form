
import { StateCreator } from 'zustand';
import { FormSubmissionData, FormSubmission } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { AppStore } from '../index';

export interface SubmissionsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SubmissionsAnalytics {
  totalSubmissions: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  averageCompletionTime: number;
  abandonmentRate: number;
}

export interface SubmissionsSlice {
  // State
  submissions: FormSubmissionData[];
  submissionsPagination: SubmissionsPagination;
  submissionsAnalytics: SubmissionsAnalytics | null;
  submissionsLoading: boolean;
  virtualizedSubmissions: FormSubmissionData[];
  
  // Actions
  fetchSubmissions: (formId: string, page?: number) => Promise<void>;
  fetchSubmissionPage: (formId: string, page: number) => Promise<void>;
  refreshSubmissions: (formId: string) => Promise<void>;
  exportSubmissions: (formId: string, format: 'csv' | 'json') => Promise<void>;
  calculateAnalytics: (formId: string) => Promise<void>;
  updateVirtualizedSubmissions: (startIndex: number, endIndex: number) => void;
  clearSubmissions: () => void;
}

// Helper function to safely parse submission data
const parseSubmissionData = (data: any): FormSubmission => {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as FormSubmission;
  }
  // Fallback for invalid data
  return {};
};

export const createSubmissionsSlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  SubmissionsSlice
> = (set, get) => ({
  // Initial state
  submissions: [],
  submissionsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  },
  submissionsAnalytics: null,
  submissionsLoading: false,
  virtualizedSubmissions: [],

  // Actions
  fetchSubmissions: async (formId: string, page = 1) => {
    const { user } = get();
    if (!user) return;

    set((state) => {
      state.submissionsLoading = true;
    });

    try {
      const limit = get().submissionsPagination.limit;
      const offset = (page - 1) * limit;

      const { data: submissions, error, count } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact' })
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      const mappedSubmissions: FormSubmissionData[] = (submissions || []).map(sub => ({
        id: sub.id,
        formId: sub.form_id,
        data: parseSubmissionData(sub.data),
        submittedAt: new Date(sub.submitted_at),
        ipAddress: sub.ip_address as string,
      }));

      set((state) => {
        if (page === 1) {
          state.submissions = mappedSubmissions;
        } else {
          state.submissions.push(...mappedSubmissions);
        }
        
        state.submissionsPagination = {
          page,
          limit,
          total: count || 0,
          hasMore: mappedSubmissions.length === limit,
        };
        
        state.submissionsLoading = false;
        
        // Update virtualized submissions (first 100 for performance)
        state.virtualizedSubmissions = state.submissions.slice(0, 100);
      });

      // Trigger analytics calculation
      get().calculateAnalytics(formId);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      set((state) => {
        state.submissionsLoading = false;
      });
    }
  },

  fetchSubmissionPage: async (formId: string, page: number) => {
    await get().fetchSubmissions(formId, page);
  },

  refreshSubmissions: async (formId: string) => {
    await get().fetchSubmissions(formId, 1);
  },

  exportSubmissions: async (formId: string, format: 'csv' | 'json') => {
    const { user, submissions } = get();
    if (!user || submissions.length === 0) return;

    try {
      if (format === 'csv') {
        // Generate CSV content
        const headers = ['ID', 'Submitted At', 'IP Address', 'Data'];
        const csvContent = [
          headers.join(','),
          ...submissions.map(sub => [
            sub.id,
            sub.submittedAt.toISOString(),
            sub.ipAddress || '',
            JSON.stringify(sub.data).replace(/"/g, '""')
          ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions-${formId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Generate JSON content
        const jsonContent = JSON.stringify(submissions, null, 2);
        
        // Download JSON
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions-${formId}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting submissions:', error);
    }
  },

  calculateAnalytics: async (formId: string) => {
    const { submissions } = get();
    
    if (submissions.length === 0) {
      set((state) => {
        state.submissionsAnalytics = {
          totalSubmissions: 0,
          submissionsToday: 0,
          submissionsThisWeek: 0,
          submissionsThisMonth: 0,
          averageCompletionTime: 0,
          abandonmentRate: 0,
        };
      });
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const analytics: SubmissionsAnalytics = {
      totalSubmissions: submissions.length,
      submissionsToday: submissions.filter(sub => sub.submittedAt >= today).length,
      submissionsThisWeek: submissions.filter(sub => sub.submittedAt >= thisWeek).length,
      submissionsThisMonth: submissions.filter(sub => sub.submittedAt >= thisMonth).length,
      averageCompletionTime: 0, // Would need additional tracking
      abandonmentRate: 0, // Would need additional tracking
    };

    set((state) => {
      state.submissionsAnalytics = analytics;
    });
  },

  updateVirtualizedSubmissions: (startIndex: number, endIndex: number) => {
    const { submissions } = get();
    const virtualizedSubmissions = submissions.slice(startIndex, endIndex + 1);
    
    set((state) => {
      state.virtualizedSubmissions = virtualizedSubmissions;
    });
  },

  clearSubmissions: () => {
    set((state) => {
      state.submissions = [];
      state.submissionsPagination = {
        page: 1,
        limit: 50,
        total: 0,
        hasMore: false,
      };
      state.submissionsAnalytics = null;
      state.virtualizedSubmissions = [];
    });
  },
});
