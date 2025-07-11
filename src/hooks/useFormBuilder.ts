
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

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `field_${timestamp}_${random}`;
  };

  const getDefaultFieldLabel = (type: FormFieldType): string => {
    const labelMap: Record<FormFieldType, string> = {
      text: 'Text Input',
      email: 'Email Address',
      number: 'Number Input',
      textarea: 'Text Area',
      select: 'Dropdown Selection',
      radio: 'Radio Buttons',
      checkbox: 'Checkbox',
      date: 'Date Picker',
      file: 'File Upload',
      phone: 'Phone Number',
      url: 'Website URL',
      chat: 'Chat Field',
      'page-break': 'Page Break',
      appointment: 'Appointment Booking'
    };
    return labelMap[type] || 'New Field';
  };

  const getDefaultOptions = (type: FormFieldType): string[] | undefined => {
    if (type === 'select' || type === 'radio') {
      return ['Option 1', 'Option 2', 'Option 3'];
    }
    return undefined;
  };

  const addField = useCallback((type: FormFieldType) => {
    try {
      console.log('Adding field of type:', type);
      
      // Validate field type
      const validTypes: FormFieldType[] = ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file', 'phone', 'url', 'chat', 'page-break', 'appointment'];
      if (!validTypes.includes(type)) {
        console.error('Invalid field type:', type);
        toast({
          title: "Invalid Field Type",
          description: "The selected field type is not supported.",
          variant: "destructive",
        });
        return;
      }
      
      const fieldId = generateUniqueId();
      const newField: FormField = {
        id: fieldId,
        type,
        label: getDefaultFieldLabel(type),
        placeholder: type === 'page-break' ? undefined : `Enter your ${getDefaultFieldLabel(type).toLowerCase()}`,
        required: false,
        options: getDefaultOptions(type),
        validation: type === 'text' || type === 'number' ? {} : undefined,
      };
      
      console.log('Created new field:', newField);
      
      setFields(prev => {
        const updated = [...prev, newField];
        console.log('Updated fields array length:', updated.length);
        return updated;
      });
      
      setSelectedFieldId(fieldId);
      
      toast({
        title: "Field Added",
        description: `${getDefaultFieldLabel(type)} has been added to your form.`,
      });
    } catch (error) {
      console.error('Error adding field:', error);
      toast({
        title: "Error Adding Field",
        description: "Failed to add field. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    try {
      console.log('Updating field:', fieldId, 'with updates:', updates);
      
      setFields(prev => {
        const fieldIndex = prev.findIndex(field => field.id === fieldId);
        if (fieldIndex === -1) {
          console.error('Field not found for update:', fieldId);
          return prev;
        }
        
        const updatedFields = [...prev];
        updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
        
        console.log('Field updated successfully:', updatedFields[fieldIndex]);
        return updatedFields;
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Error Updating Field",
        description: "Failed to update field. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    try {
      console.log('Deleting field:', fieldId);
      
      setFields(prev => {
        const filtered = prev.filter(field => field.id !== fieldId);
        console.log('Fields after deletion:', filtered.length);
        return filtered;
      });
      
      setSelectedFieldId(prev => prev === fieldId ? null : prev);
      
      toast({
        title: "Field Deleted",
        description: "Field has been removed from your form.",
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Error Deleting Field",
        description: "Failed to delete field. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
    try {
      console.log('Moving field:', fieldId, 'direction:', direction);
      
      setFields(prev => {
        const index = prev.findIndex(f => f.id === fieldId);
        if (index === -1) {
          console.error('Field not found for move:', fieldId);
          return prev;
        }
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) {
          console.log('Cannot move field - would be out of bounds');
          return prev;
        }
        
        const newFields = [...prev];
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        
        console.log('Field moved successfully');
        return newFields;
      });
    } catch (error) {
      console.error('Error moving field:', error);
      toast({
        title: "Error Moving Field",
        description: "Failed to move field. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const loadForm = useCallback((form: SavedForm) => {
    try {
      console.log('Loading form:', form.name, 'with', form.fields.length, 'fields');
      
      if (!form.fields || !Array.isArray(form.fields)) {
        console.error('Form has invalid fields data:', form.fields);
        toast({
          title: "Invalid Form Data",
          description: "This form has corrupted field data and cannot be loaded.",
          variant: "destructive",
        });
        return;
      }
      
      setFields(form.fields);
      setCurrentForm(form);
      setSelectedFieldId(null);
      
      toast({
        title: "Form Loaded",
        description: `"${form.name}" is now ready for editing.`,
      });
    } catch (error) {
      console.error('Error loading form:', error);
      toast({
        title: "Error Loading Form",
        description: "Failed to load form. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const selectTemplate = useCallback((fields: FormField[]) => {
    try {
      console.log('Selecting template with', fields.length, 'fields');
      
      if (!Array.isArray(fields)) {
        console.error('Invalid template fields:', fields);
        toast({
          title: "Invalid Template",
          description: "The selected template has invalid data.",
          variant: "destructive",
        });
        return;
      }
      
      setFields(fields);
      setSelectedFieldId(null);
      setCurrentForm(null);
      
      toast({
        title: "Template Applied",
        description: "Template has been applied to your form.",
      });
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Error Applying Template",
        description: "Failed to apply template. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const startNewForm = useCallback(() => {
    try {
      console.log('Starting new form, max forms reached:', maxFormsReached);
      
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
    } catch (error) {
      console.error('Error starting new form:', error);
      toast({
        title: "Error Starting New Form",
        description: "Failed to start new form. Please try again.",
        variant: "destructive",
      });
    }
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
