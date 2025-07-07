
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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

const FormSaveDialogComponent = ({ isOpen, onClose, onSave, initialData, fields = [] }: FormSaveDialogProps) => {
  // Move ALL hooks to top before any conditionals
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
  const memoizedInitialData = useMemo(() => initialData, [
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

  // Early return if dialog is not open - this prevents infinite renders
  if (!isOpen) {
    return null;
  }

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
      setFormData({
        name: memoizedInitialData.name,
        description: memoizedInitialData.description,
        isPublic: memoizedInitialData.isPublic,
        knowledgeBaseId: memoizedInitialData.knowledgeBaseId || '',
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
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleKnowledgeBaseChange = useCallback((value: string) => {
    console.log('Knowledge base selected:', value);
    setFormData(prev => ({ ...prev, knowledgeBaseId: value }));
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
};

// Wrap with React.memo to prevent unnecessary re-renders
export const FormSaveDialog = memo(FormSaveDialogComponent);
