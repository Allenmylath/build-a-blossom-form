
import { useState, useEffect } from 'react';
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

  // Determine if we're in controlled mode (external state) or uncontrolled mode (internal state)
  const isControlledMode = externalFields !== undefined && externalSetFields !== undefined;

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
    initialFields: isControlledMode ? [] : [], // Don't initialize with external fields to avoid conflicts
    initialCurrentForm: isControlledMode ? null : null,
    externalOnSave,
    maxFormsReached,
  });

  // Sync external state changes with internal state when in controlled mode
  useEffect(() => {
    if (isControlledMode && externalFields) {
      console.log('Syncing external fields to internal state:', externalFields.length, 'fields');
      setInternalFields(externalFields);
    }
  }, [externalFields, isControlledMode, setInternalFields]);

  useEffect(() => {
    if (isControlledMode && externalCurrentForm !== undefined) {
      console.log('Syncing external current form to internal state:', externalCurrentForm?.name);
      setInternalCurrentForm(externalCurrentForm);
    }
  }, [externalCurrentForm, isControlledMode, setInternalCurrentForm]);

  // Use external state if provided, otherwise use internal state
  const activeFields = isControlledMode ? (externalFields || []) : internalFields;
  const activeCurrentForm = isControlledMode ? externalCurrentForm : internalCurrentForm;

  // State setters that respect controlled vs uncontrolled mode
  const handleFieldsChange = (newFields: FormField[] | ((prev: FormField[]) => FormField[])) => {
    console.log('handleFieldsChange called with:', typeof newFields === 'function' ? 'function' : newFields.length, 'fields');
    
    if (isControlledMode && externalSetFields) {
      if (typeof newFields === 'function') {
        externalSetFields(prev => {
          const result = newFields(prev);
          console.log('External fields updated via function, new length:', result.length);
          return result;
        });
      } else {
        console.log('External fields updated directly, new length:', newFields.length);
        externalSetFields(newFields);
      }
    } else {
      if (typeof newFields === 'function') {
        setInternalFields(prev => {
          const result = newFields(prev);
          console.log('Internal fields updated via function, new length:', result.length);
          return result;
        });
      } else {
        console.log('Internal fields updated directly, new length:', newFields.length);
        setInternalFields(newFields);
      }
    }
  };

  const handleCurrentFormChange = (newForm: SavedForm | null) => {
    if (!isControlledMode) {
      setInternalCurrentForm(newForm);
    }
    // In controlled mode, parent component manages currentForm state
  };

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
    setCurrentForm: handleCurrentFormChange,
    onLoadForm: (form: SavedForm) => {
      console.log('Loading form in FormBuilder:', form.name);
      loadForm(form);
      // Update fields through the proper setter
      handleFieldsChange(form.fields);
    },
    onSelectTemplate: (fields: FormField[]) => {
      console.log('Selecting template in FormBuilder:', fields.length, 'fields');
      selectTemplate(fields);
      // Update fields through the proper setter  
      handleFieldsChange(fields);
    },
    externalOnSave,
  });

  const handleAddField = (type: any) => {
    console.log('handleAddField called in FormBuilder with type:', type);
    console.log('Current fields before add:', activeFields.length);
    
    // Call the addField function from useFormBuilder
    addField(type);
    
    // Force update the fields state to include the new field
    // The addField function should have already updated the internal state
    // but we need to ensure it propagates to external state if in controlled mode
    if (isControlledMode) {
      // Get the updated fields from the internal state and propagate to external
      // This is a bit of a workaround since addField operates on internal state
      setTimeout(() => {
        console.log('Syncing internal fields to external after add');
        handleFieldsChange(internalFields);
      }, 0);
    }
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    console.log('Updating field in FormBuilder:', fieldId);
    updateField(fieldId, updates);
    
    // Sync the update to external state if in controlled mode
    if (isControlledMode) {
      setTimeout(() => {
        console.log('Syncing field update to external state');
        handleFieldsChange(internalFields);
      }, 0);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    console.log('Deleting field in FormBuilder:', fieldId);
    deleteField(fieldId);
    
    // Sync the deletion to external state if in controlled mode
    if (isControlledMode) {
      setTimeout(() => {
        console.log('Syncing field deletion to external state');
        handleFieldsChange(internalFields);
      }, 0);
    }
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    console.log('Moving field in FormBuilder:', fieldId, direction);
    moveField(fieldId, direction);
    
    // Sync the move to external state if in controlled mode
    if (isControlledMode) {
      setTimeout(() => {
        console.log('Syncing field move to external state');
        handleFieldsChange(internalFields);
      }, 0);
    }
  };

  const handleStartNewForm = () => {
    console.log('Starting new form in FormBuilder');
    startNewForm();
    handleFieldsChange([]);
    handleCurrentFormChange(null);
  };

  const onExportImport = (action: 'export' | 'import') => {
    if (action === 'export') {
      setShowExportDialog(true);
    } else {
      handleExportImport(action);
    }
  };

  console.log('FormBuilder render - activeFields:', activeFields.length, 'activeCurrentForm:', activeCurrentForm?.name);

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
          onAddField={handleAddField}
          onSelectField={setSelectedFieldId}
          onMoveField={handleMoveField}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
          onSave={() => setShowSaveDialog(true)}
          onNew={handleStartNewForm}
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
