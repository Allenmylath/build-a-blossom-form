
import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SavedForm, FormSubmissionData, FormField } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const useFormFetcher = (user: User | null) => {
  const activeOperationsRef = useRef(new Set<string>());

  const fetchForms = async (): Promise<SavedForm[]> => {
    if (!user) {
      console.log('No user provided, returning empty forms array');
      return [];
    }
    
    const operationId = `fetch-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
    try {
      console.log('Fetching forms for user:', user.id);
      
      const { data: forms, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_submissions (
            id,
            data,
            submitted_at,
            ip_address,
            user_id,
            submission_type,
            completion_time_seconds,
            total_interactions,
            chat_session_references,
            metadata
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching forms:', error);
        toast({
          title: "Error loading forms",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (!forms) {
        console.log('No forms data returned from Supabase');
        return [];
      }

      console.log('Fetched forms data:', forms.length, 'forms');

      const mappedForms: SavedForm[] = forms.map(form => {
        try {
          const submissions: FormSubmissionData[] = (form.form_submissions || []).map((sub: any) => ({
            id: sub.id,
            formId: form.id,
            data: sub.data || {},
            submittedAt: new Date(sub.submitted_at),
            ipAddress: sub.ip_address,
            userId: sub.user_id,
            submissionType: sub.submission_type || 'traditional',
            completionTimeSeconds: sub.completion_time_seconds,
            totalInteractions: sub.total_interactions || 1,
            chatSessionReferences: sub.chat_session_references || [],
            metadata: sub.metadata || {}
          }));

          console.log(`Form "${form.name}" has ${submissions.length} submissions`);

          return {
            id: form.id,
            name: form.name,
            description: form.description,
            fields: Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [],
            createdAt: new Date(form.created_at),
            updatedAt: new Date(form.updated_at),
            isPublic: form.is_public,
            shareUrl: form.share_url,
            submissions,
          };
        } catch (formError) {
          console.error('Error processing form:', form.id, formError);
          return {
            id: form.id,
            name: form.name || 'Untitled Form',
            description: form.description,
            fields: [],
            createdAt: new Date(form.created_at),
            updatedAt: new Date(form.updated_at),
            isPublic: form.is_public,
            shareUrl: form.share_url,
            submissions: [],
          };
        }
      });

      console.log('Mapped forms successfully:', mappedForms.length, 'forms');
      return mappedForms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load forms. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      activeOperationsRef.current.delete(operationId);
    }
  };

  const refreshSingleForm = async (formId: string): Promise<SavedForm | null> => {
    if (!user || !formId) {
      console.log('No user or formId provided for refresh');
      return null;
    }
    
    const operationId = `refresh-${formId}-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
    try {
      console.log('Refreshing single form:', formId);
      
      const { data: form, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_submissions (
            id,
            data,
            submitted_at,
            ip_address,
            user_id,
            submission_type,
            completion_time_seconds,
            total_interactions,
            chat_session_references,
            metadata
          )
        `)
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing form:', error);
        return null;
      }

      if (!form) {
        console.log('No form data returned for refresh');
        return null;
      }

      const submissions: FormSubmissionData[] = (form.form_submissions || []).map((sub: any) => ({
        id: sub.id,
        formId: form.id,
        data: sub.data || {},
        submittedAt: new Date(sub.submitted_at),
        ipAddress: sub.ip_address,
        userId: sub.user_id,
        submissionType: sub.submission_type || 'traditional',
        completionTimeSeconds: sub.completion_time_seconds,
        totalInteractions: sub.total_interactions || 1,
        chatSessionReferences: sub.chat_session_references || [],
        metadata: sub.metadata || {}
      }));

      const updatedForm: SavedForm = {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [],
        createdAt: new Date(form.created_at),
        updatedAt: new Date(form.updated_at),
        isPublic: form.is_public,
        shareUrl: form.share_url,
        submissions,
      };

      console.log('Refreshed form with', updatedForm.submissions.length, 'submissions');
      return updatedForm;
    } catch (error) {
      console.error('Error refreshing single form:', error);
      return null;
    } finally {
      activeOperationsRef.current.delete(operationId);
    }
  };

  return {
    fetchForms,
    refreshSingleForm,
    activeOperationsRef,
  };
};
