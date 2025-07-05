
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
  externalOnSave?: (formData: { name: string; description: string; isPublic: boolean }) => Promise<void>;
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
  externalOnSave,
}: UseFormHandlersProps) => {
  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean }) => {
    if (externalOnSave) {
      await externalOnSave(formData);
      return;
    }

    if (maxFormsReached && !currentForm) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
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
    }
  };

  const handleLoadForm = (form: SavedForm) => {
    onLoadForm(form);
  };

  const handleDeleteForm = async (formId: string) => {
    await deleteForm(formId);
    if (currentForm?.id === formId) {
      setCurrentForm(null);
    }
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
        title: "Share Link Generated",
        description: "Form share link has been copied to clipboard.",
      });
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    onSelectTemplate(template.fields);
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied to your form.`,
    });
  };

  const handleExportImport = (action: 'export' | 'import') => {
    if (action === 'export') {
      // This would be handled by the parent component
    } else {
      toast({
        title: "Import Feature",
        description: "Import functionality coming soon!",
      });
    }
  };

  return {
    handleSaveForm,
    handleLoadForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleShareForm,
    handleSelectTemplate,
    handleExportImport,
  };
};
