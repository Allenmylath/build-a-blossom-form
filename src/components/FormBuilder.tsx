
import React, { useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilderContent } from './form-builder/FormBuilderContent';
import { NavigationHeader } from './NavigationHeader';
import { FormSaveDialog } from './FormSaveDialog';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useAppStore, useUserPlanState, useUserPlanActions } from '@/store';
import { useFormHandlers } from '@/hooks/useFormHandlers';

interface FormBuilderProps {
  user: User;
}

const FormBuilderComponent = ({ user }: FormBuilderProps) => {
  const { 
    savedForms, 
    formsLoading, 
    saveForm,
    deleteForm
  } = useAppStore();
  
  const { userSubscription, planLimits } = useUserPlanState();
  const { fetchUserSubscription } = useUserPlanActions();
  
  // Memoize plan-based restrictions to prevent recalculation
  const planRestrictions = useMemo(() => ({
    maxFormsReached: planLimits.maxForms !== -1 && savedForms.length >= planLimits.maxForms,
    isHobbyPlan: userSubscription?.plan_type === 'hobby'
  }), [planLimits.maxForms, savedForms.length, userSubscription?.plan_type]);
  
  useEffect(() => {
    // Ensure user subscription is loaded
    if (!userSubscription && user) {
      fetchUserSubscription();
    }
  }, [user, userSubscription, fetchUserSubscription]);

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
    maxFormsReached: planRestrictions.maxFormsReached,
    saveForm,
    deleteForm,
    fields,
    currentForm,
    setCurrentForm,
    onLoadForm: loadForm,
    onSelectTemplate: selectTemplate,
  });

  // Memoize the onClose callback to prevent recreation
  const handleCloseDialog = useCallback(() => {
    setShowSaveDialog(false);
  }, [setShowSaveDialog]);

  // Memoize the initialData object to prevent recreation
  const dialogInitialData = useMemo(() => {
    if (!currentForm) return undefined;
    
    return {
      name: currentForm.name,
      description: currentForm.description || '',
      isPublic: currentForm.isPublic,
      knowledgeBaseId: currentForm.knowledgeBaseId
    };
  }, [currentForm?.name, currentForm?.description, currentForm?.isPublic, currentForm?.knowledgeBaseId]);

  return (
    <div className="min-h-screen bg-green-50">
      <NavigationHeader />
      <FormBuilderContent
        user={user}
        fields={fields}
        selectedFieldId={selectedFieldId}
        currentForm={currentForm}
        savedForms={savedForms}
        isHobbyPlan={planRestrictions.isHobbyPlan}
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
        onClose={handleCloseDialog}
        onSave={handleSaveForm}
        fields={fields}
        initialData={dialogInitialData}
      />
    </div>
  );
};

export const FormBuilder = React.memo(FormBuilderComponent);
