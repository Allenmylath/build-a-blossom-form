
import { User } from '@supabase/supabase-js';
import { FormBuilderTabs } from './FormBuilderTabs';
import { FormBuilderHeader } from './FormBuilderHeader';
import { SavedForm, FormField, FormTemplate, FormFieldType } from '@/types/form';

interface FormBuilderContentProps {
  user: User;
  fields: FormField[];
  selectedFieldId: string | null;
  currentForm: SavedForm | null;
  savedForms: SavedForm[];
  isHobbyPlan: boolean;
  onAddField: (type: FormFieldType) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onSave: () => void;
  onNew: () => void;
  onExportImport: (action: 'export' | 'import') => void;
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => Promise<void>;
  onDuplicateForm: (form: SavedForm) => Promise<void>;
  onShareForm: (form: SavedForm) => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
}

export const FormBuilderContent = ({
  user,
  fields,
  selectedFieldId,
  currentForm,
  savedForms,
  isHobbyPlan,
  onAddField,
  onMoveField,
  onUpdateField,
  onDeleteField,
  onSave,
  onNew,
  onExportImport,
  onLoadForm,
  onDeleteForm,
  onDuplicateForm,
  onShareForm,
  onSelectTemplate,
  onUpdateForm,
}: FormBuilderContentProps) => {
  return (
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
        onAddField={onAddField}
        onSelectField={(fieldId) => {
          // This will be handled by selecting the field in the useFormBuilder hook
          // For now, we'll keep the existing selectedFieldId logic
        }}
        onMoveField={onMoveField}
        onUpdateField={onUpdateField}
        onDeleteField={onDeleteField}
        onSave={onSave}
        onNew={onNew}
        onExportImport={onExportImport}
        onLoadForm={onLoadForm}
        onDeleteForm={onDeleteForm}
        onDuplicateForm={onDuplicateForm}
        onShareForm={onShareForm}
        onSelectTemplate={onSelectTemplate}
        onUpdateForm={onUpdateForm}
      />
    </div>
  );
};
