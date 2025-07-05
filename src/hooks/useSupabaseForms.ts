
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormField, SavedForm, FormSubmissionData } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch forms from Supabase and return the data
  const fetchForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!user) return [];
    
    setLoading(true);
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
            ip_address
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

      console.log('Fetched forms data:', forms);

      const mappedForms: SavedForm[] = forms.map(form => {
        const submissions: FormSubmissionData[] = form.form_submissions.map((sub: any) => ({
          id: sub.id,
          formId: form.id,
          data: sub.data,
          submittedAt: new Date(sub.submitted_at),
          ipAddress: sub.ip_address,
        }));

        console.log(`Form ${form.name} has ${submissions.length} submissions:`, submissions);

        return {
          id: form.id,
          name: form.name,
          description: form.description,
          fields: (form.fields as unknown as FormField[]) || [],
          createdAt: new Date(form.created_at),
          updatedAt: new Date(form.updated_at),
          isPublic: form.is_public,
          shareUrl: form.share_url,
          submissions,
        };
      });

      console.log('Mapped forms:', mappedForms);
      setSavedForms(mappedForms);
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
      setLoading(false);
    }
  }, [user]);

  // Refresh single form by ID and return updated form
  const refreshSingleForm = async (formId: string): Promise<SavedForm | null> => {
    if (!user) return null;
    
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
            ip_address
          )
        `)
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing form:', error);
        return null;
      }

      const submissions: FormSubmissionData[] = form.form_submissions.map((sub: any) => ({
        id: sub.id,
        formId: form.id,
        data: sub.data,
        submittedAt: new Date(sub.submitted_at),
        ipAddress: sub.ip_address,
      }));

      const updatedForm: SavedForm = {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: (form.fields as unknown as FormField[]) || [],
        createdAt: new Date(form.created_at),
        updatedAt: new Date(form.updated_at),
        isPublic: form.is_public,
        shareUrl: form.share_url,
        submissions,
      };

      console.log('Refreshed form with submissions:', updatedForm.submissions.length);

      // Update the form in state
      setSavedForms(forms => forms.map(f => f.id === updatedForm.id ? updatedForm : f));
      
      return updatedForm;
    } catch (error) {
      console.error('Error refreshing single form:', error);
      return null;
    }
  };

  // Save form to Supabase
  const saveForm = async (formData: { name: string; description: string; isPublic: boolean }, fields: FormField[], existingForm?: SavedForm) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save forms.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const shareUrl = `${window.location.origin}/form/`;
      
      if (existingForm) {
        // Update existing form
        const { data, error } = await supabase
          .from('forms')
          .update({
            name: formData.name,
            description: formData.description,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
            share_url: shareUrl + existingForm.id,
          })
          .eq('id', existingForm.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Error updating form",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        const updatedForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: (data.fields as unknown as FormField[]) || [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: data.share_url,
          submissions: existingForm.submissions,
        };

        setSavedForms(forms => forms.map(f => f.id === updatedForm.id ? updatedForm : f));
        return updatedForm;
      } else {
        // Create new form
        const { data, error } = await supabase
          .from('forms')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
          })
          .select()
          .single();

        if (error) {
          toast({
            title: "Error saving form",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        // Update with share URL
        const { data: updatedData, error: updateError } = await supabase
          .from('forms')
          .update({ share_url: shareUrl + data.id })
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating share URL:', updateError);
        }

        const newForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: (data.fields as unknown as FormField[]) || [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: (updatedData?.share_url || shareUrl + data.id),
          submissions: [],
        };

        setSavedForms(forms => [newForm, ...forms]);
        return newForm;
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete form from Supabase
  const deleteForm = async (formId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error deleting form",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSavedForms(forms => forms.filter(f => f.id !== formId));
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load forms when user changes
  useEffect(() => {
    if (user) {
      fetchForms();
    } else {
      setSavedForms([]);
    }
  }, [user, fetchForms]);

  return {
    savedForms,
    loading,
    saveForm,
    deleteForm,
    refreshForms: fetchForms,
    refreshSingleForm,
  };
};
