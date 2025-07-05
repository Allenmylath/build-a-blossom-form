
import { useState, useCallback } from 'react';
import { FormField, FormFieldType, SavedForm } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface UseFormBuilderProps {
  initialFields?: FormField[];
  initialCurrentForm?: SavedForm | null;
  externalOnSave?: (formData: { name: string; description: string; isPublic: boolean }) => Promise<void>;
  maxFormsReached?: boolean;
}

export const useFormBuilder = ({
  initialFields = [],
  initialCurrentForm = null,
  externalOnSave,
  maxFormsReached = false,
}: UseFormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [currentForm, setCurrentForm] = useState<SavedForm | null>(initialCurrentForm);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const addField = useCallback((type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    setSelectedFieldId(prev => prev === fieldId ? null : prev);
  }, []);

  const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === fieldId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newFields = [...prev];
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      return newFields;
    });
  }, []);

  const loadForm = useCallback((form: SavedForm) => {
    setFields(form.fields);
    setCurrentForm(form);
    setSelectedFieldId(null);
    toast({
      title: "Form Loaded",
      description: `"${form.name}" is now ready for editing.`,
    });
  }, []);

  const selectTemplate = useCallback((fields: FormField[]) => {
    setFields(fields);
    setSelectedFieldId(null);
    setCurrentForm(null);
  }, []);

  const startNewForm = useCallback(() => {
    if (maxFormsReached) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
        variant: "destructive",
      });
      return;
    }

    setFields([]);
    setSelectedFieldId(null);
    setCurrentForm(null);
    toast({
      title: "New Form Started",
      description: "You can now start building your new form.",
    });
  }, [maxFormsReached]);

  return {
    fields,
    setFields,
    currentForm,
    setCurrentForm,
    selectedFieldId,
    setSelectedFieldId,
    addField,
    updateField,
    deleteField,
    moveField,
    loadForm,
    selectTemplate,
    startNewForm,
  };
};
