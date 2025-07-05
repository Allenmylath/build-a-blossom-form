import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormField, SavedForm, FormSubmissionData } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const activeOperationsRef = useRef(new Set<string>());

  // Fetch forms from Supabase and return the data
  const fetchForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!user) {
      console.log('No user provided, returning empty forms array');
      setSavedForms([]);
      return [];
    }
    
    const operationId = `fetch-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
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

      if (!forms) {
        console.log('No forms data returned from Supabase');
        setSavedForms([]);
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
          // Return a safe fallback for corrupted forms
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
      
      // Only update state if this operation is still active
      if (activeOperationsRef.current.has(operationId)) {
        setSavedForms(mappedForms);
      }
      
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
      setLoading(false);
    }
  }, [user]);

  // Refresh single form by ID and return updated form
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

      // Only update state if this operation is still active
      if (activeOperationsRef.current.has(operationId)) {
        setSavedForms(forms => forms.map(f => f.id === updatedForm.id ? updatedForm : f));
      }
      
      return updatedForm;
    } catch (error) {
      console.error('Error refreshing single form:', error);
      return null;
    } finally {
      activeOperationsRef.current.delete(operationId);
    }
  };

  // Save form to Supabase
  const saveForm = async (formData: { name: string; description: string; isPublic: boolean }, fields: FormField[], existingForm?: SavedForm) => {
    if (!user) {
      console.error('No user provided for save operation');
      toast({
        title: "Authentication required",
        description: "Please sign in to save forms.",
        variant: "destructive",
      });
      return null;
    }

    // Validate inputs
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required.",
        variant: "destructive",
      });
      return null;
    }

    if (!Array.isArray(fields)) {
      console.error('Invalid fields data provided for save');
      toast({
        title: "Validation Error",
        description: "Form fields data is invalid.",
        variant: "destructive",
      });
      return null;
    }

    const operationId = `save-${existingForm?.id || 'new'}-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
    setLoading(true);
    try {
      const shareUrl = `${window.location.origin}/form/`;
      
      if (existingForm) {
        console.log('Updating existing form:', existingForm.id);
        
        // Update existing form
        const { data, error } = await supabase
          .from('forms')
          .update({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
            share_url: shareUrl + existingForm.id,
          })
          .eq('id', existingForm.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating form:', error);
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
          fields: Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: data.share_url,
          submissions: existingForm.submissions,
        };

        // Only update state if this operation is still active
        if (activeOperationsRef.current.has(operationId)) {
          setSavedForms(forms => forms.map(f => f.id === updatedForm.id ? updatedForm : f));
        }
        
        console.log('Form updated successfully:', updatedForm.name);
        return updatedForm;
      } else {
        console.log('Creating new form');
        
        // Create new form
        const { data, error } = await supabase
          .from('forms')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating form:', error);
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
          fields: Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: (updatedData?.share_url || shareUrl + data.id),
          submissions: [],
        };

        // Only update state if this operation is still active
        if (activeOperationsRef.current.has(operationId)) {
          setSavedForms(forms => [newForm, ...forms]);
        }
        
        console.log('New form created successfully:', newForm.name);
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
      activeOperationsRef.current.delete(operationId);
      setLoading(false);
    }
  };

  // Delete form from Supabase
  const deleteForm = async (formId: string) => {
    if (!user || !formId) {
      console.error('No user or formId provided for delete operation');
      return;
    }

    const operationId = `delete-${formId}-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
    setLoading(true);
    try {
      console.log('Deleting form:', formId);
      
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting form:', error);
        toast({
          title: "Error deleting form",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Only update state if this operation is still active
      if (activeOperationsRef.current.has(operationId)) {
        setSavedForms(forms => forms.filter(f => f.id !== formId));
      }
      
      console.log('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    } finally {
      activeOperationsRef.current.delete(operationId);
      setLoading(false);
    }
  };

  // Load forms when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, fetching forms');
      fetchForms();
    } else {
      console.log('No user, clearing forms');
      setSavedForms([]);
      // Clear any active operations
      activeOperationsRef.current.clear();
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
