
import { supabase } from '@/integrations/supabase/client';
import { FormSubmissionData, FormSubmission, ChatFieldResponse } from '@/types/form';

export class FormSubmissionHandler {
  static async submitForm(formId: string, formData: Record<string, any>): Promise<FormSubmissionData> {
    try {
      console.log('FormSubmissionHandler: Starting submission for form:', formId);
      
      // Clean the form data to remove any undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      console.log('FormSubmissionHandler: Cleaned form data:', cleanedData);

      // Get current user (null for anonymous users)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      console.log('FormSubmissionHandler: User ID:', userId);

      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          user_id: userId,
          data: cleanedData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('FormSubmissionHandler: Supabase error:', error);
        throw new Error(`Submission failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from submission');
      }

      console.log('FormSubmissionHandler: Submission successful:', data.id);

      return {
        id: data.id,
        formId: data.form_id,
        data: data.data as FormSubmission,
        submittedAt: new Date(data.submitted_at),
        ipAddress: data.ip_address as string,
        userId: data.user_id,
        submissionType: (data.submission_type as any) || 'traditional',
        completionTimeSeconds: data.completion_time_seconds,
        totalInteractions: data.total_interactions || 1,
        chatSessionReferences: (data.chat_session_references as string[]) || [],
        metadata: (data.metadata as any) || {}
      };
    } catch (error) {
      console.error('FormSubmissionHandler: Error in submitForm:', error);
      throw error;
    }
  }

  static async getFormSubmissions(formId: string): Promise<FormSubmissionData[]> {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching form submissions:', error);
        throw error;
      }

      return (data || []).map(submission => ({
        id: submission.id,
        formId: submission.form_id,
        data: submission.data as FormSubmission,
        submittedAt: new Date(submission.submitted_at),
        ipAddress: submission.ip_address as string,
        userId: submission.user_id,
        submissionType: (submission.submission_type as any) || 'traditional',
        completionTimeSeconds: submission.completion_time_seconds,
        totalInteractions: submission.total_interactions || 1,
        chatSessionReferences: (submission.chat_session_references as string[]) || [],
        metadata: (submission.metadata as any) || {}
      }));
    } catch (error) {
      console.error('FormSubmissionHandler: Error in getFormSubmissions:', error);
      throw error;
    }
  }
  static async createHybridSubmission(
    formId: string,
    traditionalData: Record<string, any>,
    chatSessions: ChatFieldResponse[],
    userId?: string,
    completionTime?: number,
    pagesVisited: string[] = []
  ): Promise<FormSubmissionData> {
    try {
      const { data, error } = await supabase.rpc('create_hybrid_submission', {
        p_form_id: formId,
        p_user_id: userId,
        p_traditional_data: traditionalData,
        p_chat_sessions: chatSessions as any,
        p_completion_time: completionTime,
        p_pages_visited: pagesVisited
      });
  
      if (error) throw error;
  
      // Fetch the created submission
      return await this.getSubmissionById(data);
    } catch (error) {
      console.error('Error creating hybrid submission:', error);
      throw error;
    }
  }

  static async getSubmissionById(submissionId: string): Promise<FormSubmissionData> {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        formId: data.form_id,
        data: data.data as FormSubmission,
        submittedAt: new Date(data.submitted_at),
        ipAddress: data.ip_address as string,
        userId: data.user_id,
        submissionType: (data.submission_type as any) || 'traditional',
        completionTimeSeconds: data.completion_time_seconds,
        totalInteractions: data.total_interactions || 1,
        chatSessionReferences: (data.chat_session_references as string[]) || [],
        metadata: (data.metadata as any) || {}
      };
    } catch (error) {
      console.error('Error fetching submission by ID:', error);
      throw error;
    }
  }
}
