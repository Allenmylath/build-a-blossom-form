
import { User } from '@supabase/supabase-js';
import { FormBuilderContent } from './form-builder/FormBuilderContent';
import { NavigationHeader } from './NavigationHeader';
import { FormSaveDialog } from './FormSaveDialog';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useAppStore } from '@/store';
import { useFormHandlers } from '@/hooks/useFormHandlers';

interface FormBuilderProps {
  user: User;
}

export const FormBuilder = ({ user }: FormBuilderProps) => {
  const { 
    savedForms, 
    formsLoading, 
    maxFormsReached, 
    isHobbyPlan,
    saveForm,
    deleteForm
  } = useAppStore();
  
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

  const {
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
  } = useFormHandlers({
    maxFormsReached,
    saveForm,
    deleteForm,
    fields,
    currentForm,
    setCurrentForm,
    onLoadForm: loadForm,
    onSelectTemplate: selectTemplate,
  });

  return (
    <div className="min-h-screen bg-green-50">
      <NavigationHeader />
      <FormBuilderContent
        user={user}
        fields={fields}
        selectedFieldId={selectedFieldId}
        currentForm={currentForm}
        savedForms={savedForms}
        isHobbyPlan={isHobbyPlan}
        onAddField={addField}
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
        onUpdateForm={handleUpdateForm}
      />

      <FormSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveForm}
        fields={fields}
        initialData={currentForm ? {
          name: currentForm.name,
          description: currentForm.description || '',
          isPublic: currentForm.isPublic,
          knowledgeBaseId: currentForm.knowledgeBaseId
        } : undefined}
      />
    </div>
  );
};
