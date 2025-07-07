import { useState } from 'react';
import { SavedForm, FormTemplate } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface UseFormHandlersProps {
  maxFormsReached: boolean;
  saveForm: (formData: { name: string; description: string; isPublic: boolean; knowledgeBaseId?: string }, fields: any[], existingForm?: SavedForm) => Promise<SavedForm | null>;
  deleteForm: (formId: string) => Promise<void>;
  updateForm: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
  fields: any[];
  currentForm: SavedForm | null;
  setCurrentForm: (form: SavedForm | null) => void;
  onLoadForm: (form: SavedForm) => void;
  onSelectTemplate: (fields: any[]) => void;
}

export const useFormHandlers = ({
  maxFormsReached,
  saveForm,
  deleteForm,
  updateForm,
  fields,
  currentForm,
  setCurrentForm,
  onLoadForm,
  onSelectTemplate,
}: UseFormHandlersProps) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean; knowledgeBaseId?: string }) => {
    console.log('Handling save form:', formData);
    
    // Check if creating new form and limit reached
    if (maxFormsReached && !currentForm) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
        variant: "destructive",
      });
      return;
    }

    // Check if there are fields to save
    if (fields.length === 0) {
      toast({
        title: "No Fields Added",
        description: "Please add at least one field to your form before saving.",
        variant: "destructive",
      });
      return;
    }

    // Check if form has chat field and requires knowledge base
    const hasChatField = fields.some(field => field.type === 'chat');
    if (hasChatField && !formData.knowledgeBaseId) {
      toast({
        title: "Knowledge Base Required",
        description: "Forms with chat fields must have a knowledge base selected.",
        variant: "destructive",
      });
      return;
    }

    const savedFormData = await saveForm(formData, fields, currentForm || undefined);
    
    if (savedFormData) {
      setCurrentForm(savedFormData);
      toast({
        title: currentForm ? "Form Updated" : "Form Saved",
        description: `"${formData.name}" has been ${currentForm ? 'updated' : 'saved'} successfully.`,
      });
      setShowSaveDialog(false);
    }
  };

  const handleUpdateForm = async (formId: string, updates: Partial<SavedForm>): Promise<SavedForm | null> => {
    try {
      console.log('handleUpdateForm called with:', { formId, updates });
      
      // Call the real updateForm function
      const updatedForm = await updateForm(formId, updates);
      
      if (updatedForm) {
        // If we're updating the currently loaded form, update it
        if (currentForm?.id === formId) {
          setCurrentForm(updatedForm);
        }
        
        toast({
          title: "Form Updated",
          description: "Changes have been saved successfully.",
        });
        
        return updatedForm;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error in handleUpdateForm:', error);
      
      toast({
        title: "Update Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
      
      return null;
    }
  };

  const handleSaveClick = () => {
    console.log('Save button clicked, fields:', fields.length);
    
    if (fields.length === 0) {
      toast({
        title: "No Fields Added",
        description: "Please add at least one field to your form before saving.",
        variant: "destructive",
      });
      return;
    }

    setShowSaveDialog(true);
  };

  const handleLoadForm = (form: SavedForm) => {
    onLoadForm(form);
  };

  const handleDeleteForm = async (formId: string) => {
    await deleteForm(formId);
  };

  const handleDuplicateForm = async (form: SavedForm) => {
    if (maxFormsReached) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
        variant: "destructive",
      });
      return;
    }
    
    const duplicatedFormData = await saveForm(
      {
        name: `${form.name} (Copy)`,
        description: form.description || '',
        isPublic: form.isPublic,
        knowledgeBaseId: form.knowledgeBaseId
      },
      form.fields
    );

    if (duplicatedFormData) {
      toast({
        title: "Form Duplicated",
        description: `"${form.name}" has been duplicated successfully.`,
      });
    }
  };

  const handleShareForm = (form: SavedForm) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
      toast({
        title: "Share Link Copied",
        description: "Form share link has been copied to clipboard.",
      });
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    onSelectTemplate(template.fields);
  };

  const handleExportImport = (action: 'export' | 'import') => {
    if (action === 'export') {
      if (fields.length === 0) {
        toast({
          title: "No Fields to Export",
          description: "Please add fields to your form before exporting.",
          variant: "destructive",
        });
        return;
      }
      // Export functionality would be implemented here
      toast({
        title: "Export Feature",
        description: "Export functionality coming soon!",
      });
    } else {
      toast({
        title: "Import Feature",
        description: "Import functionality coming soon!",
      });
    }
  };

  return {
    showSaveDialog,
    setShowSaveDialog,
    handleSaveForm,
    handleUpdateForm,
    handleSaveClick,
    handleLoadForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleShareForm,
    handleSelectTemplate,
    handleExportImport,
  };
};
