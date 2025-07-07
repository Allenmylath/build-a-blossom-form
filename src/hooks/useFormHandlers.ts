
import { useState } from 'react';
import { SavedForm, FormTemplate } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface UseFormHandlersProps {
  maxFormsReached: boolean;
  saveForm: (formData: { name: string; description: string; isPublic: boolean }, fields: any[], existingForm?: SavedForm) => Promise<SavedForm | null>;
  deleteForm: (formId: string) => Promise<void>;
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
  fields,
  currentForm,
  setCurrentForm,
  onLoadForm,
  onSelectTemplate,
}: UseFormHandlersProps) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean }) => {
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
        isPublic: form.isPublic
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
    handleSaveClick,
    handleLoadForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleShareForm,
    handleSelectTemplate,
    handleExportImport,
  };
};
