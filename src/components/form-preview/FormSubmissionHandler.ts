
import { supabase } from '@/integrations/supabase/client';
import { FormSubmissionData, FormSubmission } from '@/types/form';

export class FormSubmissionHandler {
  static async submitForm(formId: string, formData: Record<string, any>): Promise<FormSubmissionData> {
    try {
      console.log('FormSubmissionHandler: Starting submission for form:', formId);
      
      // Clean the form data to remove any undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      console.log('FormSubmissionHandler: Cleaned form data:', cleanedData);

      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
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
        submittedAt: new Date(data.submitted_at)
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
        submittedAt: new Date(submission.submitted_at)
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
        p_chat_sessions: chatSessions,
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
}
