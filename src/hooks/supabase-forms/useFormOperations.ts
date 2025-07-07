
import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormField, SavedForm, FormSubmissionData } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const useFormOperations = (user: User | null) => {
  const activeOperationsRef = useRef(new Set<string>());

  const saveForm = async (
    formData: { name: string; description: string; isPublic: boolean }, 
    fields: FormField[], 
    existingForm?: SavedForm
  ) => {
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
    
    try {
      const shareUrl = `${window.location.origin}/form/`;
      
      if (existingForm) {
        console.log('Updating existing form:', existingForm.id);
        
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

        console.log('Form updated successfully:', updatedForm.name);
        return updatedForm;
      } else {
        console.log('Creating new form');
        
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
    }
  };

  const deleteForm = async (formId: string) => {
    if (!user || !formId) {
      console.error('No user or formId provided for delete operation');
      return;
    }

    const operationId = `delete-${formId}-${Date.now()}`;
    activeOperationsRef.current.add(operationId);
    
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
    }
  };

  return {
    saveForm,
    deleteForm,
    activeOperationsRef,
  };
};
