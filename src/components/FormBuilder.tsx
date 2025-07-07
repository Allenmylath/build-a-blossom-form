
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilderTabs } from './form-builder/FormBuilderTabs';
import { FormBuilderHeader } from './form-builder/FormBuilderHeader';
import { FormPreview } from './FormPreview';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { NavigationHeader } from './NavigationHeader';
import { FormTemplate } from '@/types/form';
import { FormSaveDialog } from './FormSaveDialog';
import { toast } from '@/hooks/use-toast';

interface FormBuilderProps {
  user: User;
}

export const FormBuilder = ({ user }: FormBuilderProps) => {
  const [activeTab, setActiveTab] = useState('builder');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { savedForms, saveForm, deleteForm, maxFormsReached, isHobbyPlan } = useSupabaseForms(user);
  
  const {
    fields,
    currentForm,
    selectedFieldId,
    addField,
    updateField,
    deleteField,
    moveField,
    loadForm,
    selectTemplate,
    startNewForm,
    setCurrentForm,
  } = useFormBuilder({
    initialFields: [],
    initialCurrentForm: null,
  });

  const selectedField = fields.find(f => f.id === selectedFieldId);

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

  const handleLoadForm = (form: any) => {
    loadForm(form);
  };

  const handleDeleteForm = async (formId: string) => {
    await deleteForm(formId);
  };

  const handleDuplicateForm = async (form: any) => {
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

  const handleShareForm = (form: any) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
      toast({
        title: "Share Link Copied",
        description: "Form share link has been copied to clipboard.",
      });
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    selectTemplate(template.fields);
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

  return (
    <div className="min-h-screen bg-green-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto p-6">
        <FormBuilderHeader 
          user={user}
          currentForm={currentForm}
          savedFormsCount={savedForms.length}
          isHobbyPlan={isHobbyPlan}
        />
        
        <FormBuilderTabs
          fields={fields}
          selectedFieldId={selectedFieldId}
          currentForm={currentForm}
          savedForms={savedForms}
          isHobbyPlan={isHobbyPlan}
          onAddField={addField}
          onSelectField={(fieldId) => {
            // This will be handled by selecting the field in the useFormBuilder hook
            // For now, we'll keep the existing selectedFieldId logic
          }}
          onMoveField={moveField}
          onUpdateField={updateField}
          onDeleteField={deleteField}
          onSave={handleSaveClick}
          onNew={startNewForm}
          onExportImport={handleExportImport}
          onLoadForm={handleLoadForm}
          onDeleteForm={handleDeleteForm}
          onDuplicateForm={handleDuplicateForm}
          onShareForm={handleShareForm}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>

      <FormSaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveForm}
        currentForm={currentForm}
      />
    </div>
  );
};
