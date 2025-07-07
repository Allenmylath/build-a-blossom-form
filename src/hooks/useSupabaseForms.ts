
import { useState, useEffect, useCallback } from 'react';
import { FormField, SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { useFormOperations } from './supabase-forms/useFormOperations';
import { useFormFetcher } from './supabase-forms/useFormFetcher';
import { HOBBY_PLAN_FORM_LIMIT } from './supabase-forms/constants';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);

  const { fetchForms, refreshSingleForm, activeOperationsRef: fetcherOperationsRef } = useFormFetcher(user);
  const { saveForm: saveFormOperation, deleteForm: deleteFormOperation, activeOperationsRef: operationsRef } = useFormOperations(user);

  // Calculate plan limitations
  const isHobbyPlan = true; // For now, assume all users are on hobby plan
  const maxFormsReached = savedForms.length >= HOBBY_PLAN_FORM_LIMIT;

  // Wrapper for fetchForms that updates state
  const refreshForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!user) {
      console.log('No user provided, clearing forms');
      setSavedForms([]);
      return [];
    }
    
    setLoading(true);
    try {
      const forms = await fetchForms();
      
      // Only update state if this operation is still active
      if (fetcherOperationsRef.current.size > 0) {
        setSavedForms(forms);
      }
      
      return forms;
    } finally {
      setLoading(false);
    }
  }, [user, fetchForms, fetcherOperationsRef]);

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

  // Load forms when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, fetching forms');
      refreshForms();
    } else {
      console.log('No user, clearing forms');
      setSavedForms([]);
      // Clear any active operations
      fetcherOperationsRef.current.clear();
      operationsRef.current.clear();
    }
  }, [user, refreshForms, fetcherOperationsRef, operationsRef]);

  return {
    savedForms,
    loading,
    saveForm,
    deleteForm,
    refreshForms,
    refreshSingleForm: refreshSingleFormWithState,
    maxFormsReached,
    isHobbyPlan,
  };
};
