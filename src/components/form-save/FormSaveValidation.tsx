
import { useCallback } from 'react';

interface FormData {
  name: string;
  description: string;
  isPublic: boolean;
  knowledgeBaseId: string;
}

interface UseFormSaveValidationProps {
  hasChatField: boolean;
  onSave: (data: { 
    name: string; 
    description: string; 
    isPublic: boolean; 
    knowledgeBaseId?: string 
  }) => void;
}

export const useFormSaveValidation = ({ hasChatField, onSave }: UseFormSaveValidationProps) => {
  const validateAndSubmit = useCallback((formData: FormData) => {
    // Validate that knowledge base is selected if form has chat field
    if (hasChatField && !formData.knowledgeBaseId) {
      console.error('Knowledge base is required for chat forms');
      return false;
    }
    
    console.log('Submitting form data:', formData);
    
    onSave({
      name: formData.name,
      description: formData.description,
      isPublic: formData.isPublic,
      knowledgeBaseId: formData.knowledgeBaseId || undefined,
    });
    
    return true;
  }, [hasChatField, onSave]);

  const shouldShowValidationError = useCallback((formData: FormData) => {
    return hasChatField && !formData.knowledgeBaseId;
  }, [hasChatField]);

  return {
    validateAndSubmit,
    shouldShowValidationError
  };
};
