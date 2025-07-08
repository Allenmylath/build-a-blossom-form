
import { supabase } from '@/integrations/supabase/client';
import { FormSubmissionData, FormSubmission } from '@/types/form';

export class FormSubmissionHandler {
  static async submitForm(
      formId: string, 
      formData: Record<string, any>,
      chatSessions: string[] = [],
      completionTime?: number,
      pagesVisited: string[] = []
    ): Promise<FormSubmissionData> {
      try {
        console.log('FormSubmissionHandler: Starting unified submission for form:', formId);
        
        // Separate traditional fields from chat responses
        const { _chatResponses, ...traditionalData } = formData;
        const hasChatResponses = chatSessions.length > 0 || _chatResponses;
        const submissionType: SubmissionType = hasChatResponses 
          ? (Object.keys(traditionalData).length > 0 ? 'hybrid' : 'chat')
          : 'traditional';
    
        // Clean the form data
        const cleanedData = Object.fromEntries(
          Object.entries(formData).filter(([_, value]) => value !== undefined)
        );
    
        const submissionPayload = {
          form_id: formId,
          data: cleanedData,
          submission_type: submissionType,
          completion_time_seconds: completionTime,
          total_interactions: Object.keys(traditionalData).length + chatSessions.length,
          chat_session_references: chatSessions,
          pages_visited: pagesVisited,
          metadata: {
            chatSessionsCount: chatSessions.length,
            formType: submissionType,
            totalInteractions: Object.keys(traditionalData).length + chatSessions.length,
            completionTimeSeconds: completionTime,
            pagesVisited: pagesVisited,
            traditionalFieldsCount: Object.keys(traditionalData).length,
            chatFieldsCount: chatSessions.length
          },
          submitted_at: new Date().toISOString()
        };
    
        const { data, error } = await supabase
          .from('form_submissions')
          .insert(submissionPayload)
          .select()
          .single();
    
        if (error) {
          console.error('FormSubmissionHandler: Supabase error:', error);
          throw new Error(`Submission failed: ${error.message}`);
        }
    
        return {
          id: data.id,
          formId: data.form_id,
          data: data.data as FormSubmission,
          submittedAt: new Date(data.submitted_at),
          userId: data.user_id,
          submissionType: data.submission_type as SubmissionType,
          completionTimeSeconds: data.completion_time_seconds,
          totalInteractions: data.total_interactions || 1,
          chatSessionReferences: data.chat_session_references || [],
          metadata: data.metadata as UnifiedSubmissionMetadata,
          ipAddress: data.ip_address
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
}
