
import { useState } from 'react';
import { FormSaveDialog } from './FormSaveDialog';
import { FormExport } from './FormExport';
import { FormField, SavedForm } from '@/types/form';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { User } from '@supabase/supabase-js';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useFormHandlers } from './form-builder/FormHandlers';
import { FormBuilderHeader } from './form-builder/FormBuilderHeader';
import { FormBuilderTabs } from './form-builder/FormBuilderTabs';

interface FormBuilderProps {
  user: User;
  onSave?: (formData: { name: string; description: string; isPublic: boolean }) => Promise<void>;
  currentForm?: SavedForm | null;
  fields?: FormField[];
  setFields?: React.Dispatch<React.SetStateAction<FormField[]>>;
}

export const FormBuilder = ({ 
  user, 
  onSave: externalOnSave, 
  currentForm: externalCurrentForm, 
  fields: externalFields, 
  setFields: externalSetFields 
}: FormBuilderProps) => {
  const { savedForms, loading, saveForm, deleteForm } = useSupabaseForms(user);
  
  // Check if user is on hobby plan (max 5 forms)
  const isHobbyPlan = true;
  const maxFormsReached = isHobbyPlan && savedForms.length >= 5;

  const {
    fields: internalFields,
    setFields: setInternalFields,
    currentForm: internalCurrentForm,
    setCurrentForm: setInternalCurrentForm,
    selectedFieldId,
    setSelectedFieldId,
    addField,
    updateField,
    deleteField,
    moveField,
    loadForm,
    selectTemplate,
    startNewForm,
  } = useFormBuilder({
    initialFields: externalFields || [],
    initialCurrentForm: externalCurrentForm || null,
    externalOnSave,
    maxFormsReached,
  });

  // Use external state if provided, otherwise use internal state
  const activeFields = externalFields || internalFields;
  const activeSetFields = externalSetFields || setInternalFields;
  const activeCurrentForm = externalCurrentForm !== undefined ? externalCurrentForm : internalCurrentForm;
  const activeSetCurrentForm = externalCurrentForm !== undefined ? () => {} : setInternalCurrentForm;

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const {
    handleSaveForm,
    handleLoadForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleShareForm,
    handleSelectTemplate,
    handleExportImport,
  } = useFormHandlers({
    maxFormsReached,
    saveForm,
    deleteForm,
    fields: activeFields,
    currentForm: activeCurrentForm,
    setCurrentForm: activeSetCurrentForm,
    onLoadForm: loadForm,
    onSelectTemplate: selectTemplate,
    externalOnSave,
  });

  const onExportImport = (action: 'export' | 'import') => {
    if (action === 'export') {
      setShowExportDialog(true);
    } else {
      handleExportImport(action);
    }
  };

  return (
    <div className="space-y-6">
      <FormBuilderHeader
        user={user}
        currentForm={activeCurrentForm}
        savedFormsCount={savedForms.length}
        isHobbyPlan={isHobbyPlan}
      />

      <div className="max-w-6xl mx-auto px-4">
        <FormBuilderTabs
          fields={activeFields}
          selectedFieldId={selectedFieldId}
          currentForm={activeCurrentForm}
          savedForms={savedForms}
          isHobbyPlan={isHobbyPlan}
          onAddField={addField}
          onSelectField={setSelectedFieldId}
          onMoveField={moveField}
          onUpdateField={updateField}
          onDeleteField={deleteField}
          onSave={() => setShowSaveDialog(true)}
          onNew={startNewForm}
          onExportImport={onExportImport}
          onLoadForm={handleLoadForm}
          onDeleteForm={handleDeleteForm}
          onDuplicateForm={handleDuplicateForm}
          onShareForm={handleShareForm}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>

      <FormSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveForm}
        initialData={activeCurrentForm ? {
          name: activeCurrentForm.name,
          description: activeCurrentForm.description || '',
          isPublic: activeCurrentForm.isPublic
        } : undefined}
      />

      <FormExport
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        fields={activeFields}
        formName={activeCurrentForm?.name || 'Untitled Form'}
      />
    </div>
  );
};
