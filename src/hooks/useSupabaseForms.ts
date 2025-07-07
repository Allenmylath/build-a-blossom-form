
import { useState, useEffect, useCallback, useRef } from 'react';
import { FormField, SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { useFormOperations } from './supabase-forms/useFormOperations';
import { useFormFetcher } from './supabase-forms/useFormFetcher';
import { HOBBY_PLAN_FORM_LIMIT } from './supabase-forms/constants';

export const useSupabaseForms = (user: User | null) => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  const { fetchForms, refreshSingleForm, activeOperationsRef: fetcherOperationsRef } = useFormFetcher(user);
  const { saveForm: saveFormOperation, deleteForm: deleteFormOperation, activeOperationsRef: operationsRef } = useFormOperations(user);

  // Calculate plan limitations
  const isHobbyPlan = true; // For now, assume all users are on hobby plan
  const maxFormsReached = savedForms.length >= HOBBY_PLAN_FORM_LIMIT;

  // Wrapper for fetchForms that updates state with deduplication
  const refreshForms = useCallback(async (): Promise<SavedForm[]> => {
    if (!user) {
      console.log('No user provided, clearing forms');
      setSavedForms([]);
      setLastUserId(null);
      return [];
    }
    
    // Prevent multiple simultaneous fetch operations
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping');
      return savedForms;
    }

    // Skip if we already have data for this user and it's recent
    if (lastUserId === user.id && savedForms.length > 0) {
      console.log('Forms already loaded for current user, skipping');
      return savedForms;
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    
    try {
      console.log('Fetching forms for user:', user.id);
      const forms = await fetchForms();
      
      // Only update state if this operation is still active and user hasn't changed
      if (fetcherOperationsRef.current.size > 0 && user.id === lastUserId) {
        setSavedForms(forms);
        console.log('Forms updated successfully:', forms.length, 'forms');
      }
      
      return forms;
    } catch (error) {
      console.error('Error in refreshForms:', error);
      return [];
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }
  }, [user, fetchForms, fetcherOperationsRef, lastUserId, savedForms]);

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

  // Handle user changes with proper cleanup and deduplication
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // If user hasn't changed, skip
    if (currentUserId === lastUserId) {
      return;
    }

    console.log('User changed from', lastUserId, 'to', currentUserId);
    
    // Update last user id immediately to prevent race conditions
    setLastUserId(currentUserId);

    if (currentUserId) {
      // Clear any ongoing operations for the previous user
      fetcherOperationsRef.current.clear();
      operationsRef.current.clear();
      
      // Only fetch if we don't have forms for this user already
      refreshForms();
    } else {
      console.log('No user, clearing forms and operations');
      setSavedForms([]);
      fetcherOperationsRef.current.clear();
      operationsRef.current.clear();
      fetchInProgressRef.current = false;
    }
  }, [user?.id, lastUserId, refreshForms, fetcherOperationsRef, operationsRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetcherOperationsRef.current.clear();
      operationsRef.current.clear();
      fetchInProgressRef.current = false;
    };
  }, [fetcherOperationsRef, operationsRef]);

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
