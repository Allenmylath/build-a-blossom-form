
import { useState, useEffect, useCallback, useRef } from 'react';
import { FormField, SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { useFormOperations } from './supabase-forms/useFormOperations';
import { useFormFetcher } from './supabase-forms/useFormFetcher';
import { useUserState } from './useUserState';
import { HOBBY_PLAN_FORM_LIMIT } from './supabase-forms/constants';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use the user state manager to prevent frequent auth changes
  const { user: stableUser, loading: userLoading, isStable: userIsStable, updateUser } = useUserState(user);
  
  const { fetchForms, refreshSingleForm, activeOperationsRef: fetcherOperationsRef } = useFormFetcher(stableUser);
  const { saveForm: saveFormOperation, deleteForm: deleteFormOperation, activeOperationsRef: operationsRef } = useFormOperations(stableUser);

  // Calculate plan limitations
  const isHobbyPlan = true; // For now, assume all users are on hobby plan
  const maxFormsReached = savedForms.length >= HOBBY_PLAN_FORM_LIMIT;

  // Update user state when the prop changes
  useEffect(() => {
    updateUser(user, false);
  }, [user?.id, updateUser]);

  // Wrapper for fetchForms that updates state with deduplication
  const refreshForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!stableUser || !userIsStable) {
      console.log('User not stable yet, skipping form fetch');
      return savedForms;
    }
    
    setLoading(true);
    
    try {
      console.log('Fetching forms for stable user:', stableUser.id);
      const forms = await fetchForms();
      
      // Only update state if this operation is still active
      if (fetcherOperationsRef.current.size > 0) {
        setSavedForms(forms);
        console.log('Forms updated successfully:', forms.length, 'forms');
      }
      
      return forms;
    } catch (error) {
      console.error('Error in refreshForms:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [stableUser, userIsStable, fetchForms, fetcherOperationsRef, savedForms]);

  // Wrapper for refreshSingleForm that updates state
  const refreshSingleFormWithState = async (formId: string): Promise<SavedForm | null> => {
    const updatedForm = await refreshSingleForm(formId);
    
    if (updatedForm && fetcherOperationsRef.current.size > 0) {
      setSavedForms(forms => forms.map(f => f.id === updatedForm.id ? updatedForm : f));
    }
    
    return updatedForm;
  };

  // Wrapper for saveForm that updates state
  const saveForm = async (formData: { name: string; description: string; isPublic: boolean }, fields: FormField[], existingForm?: SavedForm) => {
    setLoading(true);
    try {
      const result = await saveFormOperation(formData, fields, existingForm);
      
      if (result && operationsRef.current.size > 0) {
        if (existingForm) {
          setSavedForms(forms => forms.map(f => f.id === result.id ? result : f));
        } else {
          setSavedForms(forms => [result, ...forms]);
        }
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for deleteForm that updates state
  const deleteForm = async (formId: string) => {
    setLoading(true);
    try {
      await deleteFormOperation(formId);
      
      // Only update state if this operation is still active
      if (operationsRef.current.size > 0) {
        setSavedForms(forms => forms.filter(f => f.id !== formId));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle stable user changes - only fetch when user is stable
  useEffect(() => {
    if (userIsStable) {
      if (stableUser) {
        console.log('User is stable, fetching forms for:', stableUser.id);
        refreshForms();
      } else {
        console.log('No stable user, clearing forms');
        setSavedForms([]);
        fetcherOperationsRef.current.clear();
        operationsRef.current.clear();
      }
    }
  }, [stableUser?.id, userIsStable, refreshForms, fetcherOperationsRef, operationsRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetcherOperationsRef.current.clear();
      operationsRef.current.clear();
    };
  }, [fetcherOperationsRef, operationsRef]);

  return {
    savedForms,
    loading: loading || userLoading,
    saveForm,
    deleteForm,
    refreshForms,
    refreshSingleForm: refreshSingleFormWithState,
    maxFormsReached,
    isHobbyPlan,
  };
};
