
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBases';
import { FormField } from '@/types/form';
import { KnowledgeBaseSelector } from './form-save/KnowledgeBaseSelector';
import { FormSaveFields } from './form-save/FormSaveFields';
import { useFormSaveValidation } from './form-save/FormSaveValidation';

interface FormSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    description: string; 
    isPublic: boolean; 
    knowledgeBaseId?: string 
  }) => void;
  initialData?: {
    name: string;
    description: string;
    isPublic: boolean;
    knowledgeBaseId?: string;
  };
  fields?: FormField[];
}

const FormSaveDialogComponent = React.memo<FormSaveDialogProps>(({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  fields = [] 
}) => {
  // Early return if dialog is not open to prevent unnecessary renders
  if (!isOpen) {
    return null;
  }

  const { user } = useAppStore();
  const { knowledgeBases, loading } = useKnowledgeBases(user);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    knowledgeBaseId: '',
  });

  // Memoize the chat field check to prevent recalculation
  const hasChatField = useMemo(() => {
    return fields.some(field => field.type === 'chat');
  }, [fields]);

  // Memoize initial data to prevent unnecessary effects
  const memoizedInitialData = useMemo(() => {
    if (!initialData) return null;
    
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      isPublic: initialData.isPublic || false,
      knowledgeBaseId: initialData.knowledgeBaseId || ''
    };
  }, [
    initialData?.name,
    initialData?.description,
    initialData?.isPublic,
    initialData?.knowledgeBaseId
  ]);

  // Use validation hook
  const { validateAndSubmit, shouldShowValidationError } = useFormSaveValidation({
    hasChatField,
    onSave
  });

  console.log('FormSaveDialog render:', {
    isOpen,
    hasChatField,
    knowledgeBases: knowledgeBases.length,
    selectedKnowledgeBaseId: formData.knowledgeBaseId,
    loading
  });

  // Only update form data when dialog opens and initialData is provided
  useEffect(() => {
    if (isOpen && memoizedInitialData) {
      setFormData(prev => {
        // Only update if values actually changed
        if (
          prev.name !== memoizedInitialData.name ||
          prev.description !== memoizedInitialData.description ||
          prev.isPublic !== memoizedInitialData.isPublic ||
          prev.knowledgeBaseId !== memoizedInitialData.knowledgeBaseId
        ) {
          return {
            name: memoizedInitialData.name,
            description: memoizedInitialData.description,
            isPublic: memoizedInitialData.isPublic,
            knowledgeBaseId: memoizedInitialData.knowledgeBaseId,
          };
        }
        return prev;
      });
    }
  }, [isOpen, memoizedInitialData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit(formData);
  }, [formData, validateAndSubmit]);

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      isPublic: false,
      knowledgeBaseId: '',
    });
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => {
      // Only update if value actually changed
      if (prev[field as keyof typeof prev] !== value) {
        return { ...prev, [field]: value };
      }
      return prev;
    });
  }, []);

  const handleKnowledgeBaseChange = useCallback((value: string) => {
    console.log('Knowledge base selected:', value);
    setFormData(prev => {
      // Only update if value actually changed
      if (prev.knowledgeBaseId !== value) {
        return { ...prev, knowledgeBaseId: value };
      }
      return prev;
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Update Form' : 'Save Form'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSaveFields
            formData={formData}
            onInputChange={handleInputChange}
          />

          <KnowledgeBaseSelector
            knowledgeBases={knowledgeBases}
            loading={loading}
            selectedKnowledgeBaseId={formData.knowledgeBaseId}
            onKnowledgeBaseChange={handleKnowledgeBaseChange}
            hasChatField={hasChatField}
            showValidationError={shouldShowValidationError(formData)}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={hasChatField && !formData.knowledgeBaseId}
            >
              {initialData ? 'Update' : 'Save'} Form
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

FormSaveDialogComponent.displayName = 'FormSaveDialog';

export const FormSaveDialog = FormSaveDialogComponent;
