
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilderTabs } from './form-builder/FormBuilderTabs';
import { FormBuilderHeader } from './form-builder/FormBuilderHeader';
import { FormPreview } from './FormPreview';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { NavigationHeader } from './NavigationHeader';
import { FormTemplate } from '@/types/form';

interface FormBuilderProps {
  user: User;
}

export const FormBuilder = ({ user }: FormBuilderProps) => {
  const [activeTab, setActiveTab] = useState('builder');
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
  } = useFormBuilder({
    initialFields: [],
    initialCurrentForm: null,
  });

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean }) => {
    const savedFormData = await saveForm(formData, fields, currentForm || undefined);
    if (savedFormData) {
      loadForm(savedFormData);
    }
  };

  const handleLoadForm = (form: any) => {
    loadForm(form);
  };

  const handleDeleteForm = async (formId: string) => {
    await deleteForm(formId);
  };

  const handleDuplicateForm = async (form: any) => {
    if (maxFormsReached) return;
    await saveForm(
      {
        name: `${form.name} (Copy)`,
        description: form.description || '',
        isPublic: form.isPublic
      },
      form.fields
    );
  };

  const handleShareForm = (form: any) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    selectTemplate(template.fields);
  };

  const handleExportImport = (action: 'export' | 'import') => {
    // Handle export/import logic
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
          onSave={() => {
            // This should trigger save dialog
          }}
          onNew={startNewForm}
          onExportImport={handleExportImport}
          onLoadForm={handleLoadForm}
          onDeleteForm={handleDeleteForm}
          onDuplicateForm={handleDuplicateForm}
          onShareForm={handleShareForm}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </div>
  );
};
