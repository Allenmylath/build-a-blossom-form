
import React, { useEffect, useCallback, useMemo } from 'react';
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

// Stable selectors to prevent re-renders
const useStableFormsState = () => useAppStore((state) => ({
  savedForms: state.savedForms,
  formsLoading: state.formsLoading,
  saveForm: state.saveForm,
  deleteForm: state.deleteForm,
}));

const useStablePlanState = () => useAppStore((state) => ({
  userSubscription: state.userSubscription,
  planLimits: state.planLimits,
  fetchUserSubscription: state.fetchUserSubscription,
}));

const FormBuilderComponent = ({ user }: FormBuilderProps) => {
  const formsState = useStableFormsState();
  const planState = useStablePlanState();
  
  // Memoize plan restrictions to prevent recalculation
  const planRestrictions = useMemo(() => {
    const maxFormsReached = planState.planLimits.maxForms !== -1 && 
                            formsState.savedForms.length >= planState.planLimits.maxForms;
    const isHobbyPlan = planState.userSubscription?.plan_type === 'hobby';
    
    return { maxFormsReached, isHobbyPlan };
  }, [
    planState.planLimits.maxForms,
    formsState.savedForms.length,
    planState.userSubscription?.plan_type
  ]);
  
  // Stable effect for fetching user subscription
  useEffect(() => {
    if (!planState.userSubscription && user?.id) {
      planState.fetchUserSubscription();
    }
  }, [user?.id, planState.userSubscription, planState.fetchUserSubscription]);

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
    saveForm: formsState.saveForm,
    deleteForm: formsState.deleteForm,
    fields,
    currentForm,
    setCurrentForm,
    onLoadForm: loadForm,
    onSelectTemplate: selectTemplate,
  });

  // Stable close dialog callback
  const handleCloseDialog = useCallback(() => {
    setShowSaveDialog(false);
  }, [setShowSaveDialog]);

  // Stable initial data for dialog
  const dialogInitialData = useMemo(() => {
    if (!currentForm) return undefined;
    
    return {
      name: currentForm.name,
      description: currentForm.description || '',
      isPublic: currentForm.isPublic,
      knowledgeBaseId: currentForm.knowledgeBaseId
    };
  }, [
    currentForm?.id, // Use ID instead of the whole object
    currentForm?.name,
    currentForm?.description,
    currentForm?.isPublic,
    currentForm?.knowledgeBaseId
  ]);

  return (
    <div className="min-h-screen bg-green-50">
      <NavigationHeader />
      <FormBuilderContent
        user={user}
        fields={fields}
        selectedFieldId={selectedFieldId}
        currentForm={currentForm}
        savedForms={formsState.savedForms}
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
