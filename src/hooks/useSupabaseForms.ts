import { useState, useEffect, useCallback, useRef } from 'react';
import { FormField, SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { useFormOperations } from './supabase-forms/useFormOperations';
import { useFormFetcher } from './supabase-forms/useFormFetcher';
import { HOBBY_PLAN_FORM_LIMIT } from './supabase-forms/constants';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  const { fetchForms, refreshSingleForm } = useFormFetcher(user);
  const { saveForm: saveFormOperation, deleteForm: deleteFormOperation } = useFormOperations(user);

  // Calculate plan limitations
  const isHobbyPlan = true;
  const maxFormsReached = savedForms.length >= HOBBY_PLAN_FORM_LIMIT;

  // Optimistic update helper
  const updateFormsOptimistically = useCallback((updater: (forms: SavedForm[]) => SavedForm[]) => {
    if (isMountedRef.current) {
      setSavedForms(updater);
    }
  }, []);

  // Initial fetch with proper loading state
  const refreshForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!user) {
      setSavedForms([]);
      setInitialLoadComplete(true);
      return [];
    }
    
    // Only show loading on initial load, not subsequent refreshes
    if (!initialLoadComplete) {
      setLoading(true);
    }
    
    try {
      const forms = await fetchForms();
      
      if (isMountedRef.current) {
        setSavedForms(forms);
        setInitialLoadComplete(true);
      }
      
      return forms;
    } catch (error) {
      console.error('Error refreshing forms:', error);
      return savedForms; // Return current state on error
    } finally {
      if (!initialLoadComplete && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, fetchForms, initialLoadComplete, savedForms]);

  // Optimized save with immediate UI update
  const saveForm = async (
    formData: { name: string; description: string; isPublic: boolean }, 
    fields: FormField[], 
    existingForm?: SavedForm
  ) => {
    try {
      let optimisticForm: SavedForm;
      
      if (existingForm) {
        // Optimistically update existing form
        optimisticForm = {
          ...existingForm,
          name: formData.name,
          description: formData.description,
          isPublic: formData.isPublic,
          fields,
          updatedAt: new Date(),
        };
        
        updateFormsOptimistically(forms => 
          forms.map(f => f.id === existingForm.id ? optimisticForm : f)
        );
      } else {
        // Optimistically add new form
        optimisticForm = {
          id: `temp-${Date.now()}`, // Temporary ID
          name: formData.name,
          description: formData.description,
          fields,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: formData.isPublic,
          submissions: [],
        };
        
        updateFormsOptimistically(forms => [optimisticForm, ...forms]);
      }
      
      // Perform actual save
      const result = await saveFormOperation(formData, fields, existingForm);
      
      if (result && isMountedRef.current) {
        // Replace optimistic update with real data
        if (existingForm) {
          updateFormsOptimistically(forms => 
            forms.map(f => f.id === existingForm.id ? result : f)
          );
        } else {
          updateFormsOptimistically(forms => 
            forms.map(f => f.id === optimisticForm.id ? result : f)
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving form:', error);
      
      // Revert optimistic update on error
      if (existingForm) {
        updateFormsOptimistically(forms => 
          forms.map(f => f.id === existingForm.id ? existingForm : f)
        );
      } else {
        updateFormsOptimistically(forms => 
          forms.filter(f => !f.id.startsWith('temp-'))
        );
      }
      
      throw error;
    }
  };

  // Optimized delete with immediate UI update
  const deleteForm = async (formId: string) => {
    const formToDelete = savedForms.find(f => f.id === formId);
    if (!formToDelete) return;
    
    // Optimistically remove form
    updateFormsOptimistically(forms => forms.filter(f => f.id !== formId));
    
    try {
      await deleteFormOperation(formId);
    } catch (error) {
      console.error('Error deleting form:', error);
      
      // Revert optimistic update on error
      updateFormsOptimistically(forms => {
        const index = forms.findIndex(f => f.createdAt > formToDelete.createdAt);
        if (index === -1) {
          return [...forms, formToDelete];
        } else {
          const newForms = [...forms];
          newForms.splice(index, 0, formToDelete);
          return newForms;
        }
      });
      
      throw error;
    }
  };

  // Optimized single form refresh
  const refreshSingleFormWithState = async (formId: string): Promise<SavedForm | null> => {
    try {
      const updatedForm = await refreshSingleForm(formId);
      
      if (updatedForm && isMountedRef.current) {
        updateFormsOptimistically(forms => 
          forms.map(f => f.id === updatedForm.id ? updatedForm : f)
        );
      }
      
      return updatedForm;
    } catch (error) {
      console.error('Error refreshing single form:', error);
      return null;
    }
  };

  // Add updateForm function
  const updateForm = async (formId: string, updates: Partial<SavedForm>): Promise<SavedForm | null> => {
    if (!user) {
      console.error('No user available for form update');
      return null;
    }

    try {
      console.log('Updating form:', formId, 'with updates:', updates);
      
      // Prepare data for Supabase (convert camelCase to snake_case)
      const supabaseUpdates: any = {};
      
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.isPublic !== undefined) supabaseUpdates.is_public = updates.isPublic;
      if (updates.fields !== undefined) supabaseUpdates.fields = updates.fields;
      if (updates.knowledgeBaseId !== undefined) supabaseUpdates.knowledge_base_id = updates.knowledgeBaseId;
      
      // Always update the updated_at timestamp
      supabaseUpdates.updated_at = new Date().toISOString();

      // Optimistically update the UI first
      const originalForm = savedForms.find(f => f.id === formId);
      if (originalForm) {
        const optimisticForm = { ...originalForm, ...updates, updatedAt: new Date() };
        updateFormsOptimistically(forms => 
          forms.map(form => form.id === formId ? optimisticForm : form)
        );
      }

      // Update in Supabase
      const { data, error } = await supabase
        .from('forms')
        .update(supabaseUpdates)
        .eq('id', formId)
        .eq('user_id', user.id) // Security: only update own forms
        .select(`
          *,
          form_submissions (
            id,
            data,
            submitted_at,
            ip_address
          )
        `)
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        
        // Revert optimistic update on error
        if (originalForm) {
          updateFormsOptimistically(forms => 
            forms.map(form => form.id === formId ? originalForm : form)
          );
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from update');
      }

      // Convert back to frontend format with proper type casting
      const updatedForm: SavedForm = {
        id: data.id,
        name: data.name,
        description: data.description,
        fields: Array.isArray(data.fields) ? data.fields as FormField[] : [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        isPublic: data.is_public,
        knowledgeBaseId: data.knowledge_base_id,
        shareUrl: data.share_url,
        submissions: (data.form_submissions || []).map((sub: any) => ({
          id: sub.id,
          formId: data.id,
          data: sub.data || {},
          submittedAt: new Date(sub.submitted_at),
          ipAddress: sub.ip_address,
        })),
      };

      // Update local state with the real data
      if (isMountedRef.current) {
        updateFormsOptimistically(forms => 
          forms.map(form => form.id === formId ? updatedForm : form)
        );
      }

      console.log('Form updated successfully:', updatedForm);
      return updatedForm;

    } catch (error) {
      console.error('Error updating form:', error);
      return null;
    }
  };

  // Load forms only when user changes, with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user) {
      refreshForms();
    } else {
      setSavedForms([]);
      setInitialLoadComplete(true);
      setLoading(false);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id]); // Only depend on user.id, not the whole user object

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    savedForms,
    loading: loading && !initialLoadComplete, // Only show loading on initial load
    saveForm,
    deleteForm,
    updateForm,
    refreshForms,
    refreshSingleForm: refreshSingleFormWithState,
    maxFormsReached,
    isHobbyPlan,
    initialLoadComplete,
  };
};
