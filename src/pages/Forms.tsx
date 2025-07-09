import { User } from '@supabase/supabase-js';
import { FormManager } from '@/components/FormManager';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { useFormHandlers } from '@/hooks/useFormHandlers';
import { useFormBuilder } from '@/hooks/useFormBuilder';

interface FormsProps {
  user: User;
}

export default function Forms({ user }: FormsProps) {
  const { savedForms, saveForm, deleteForm, updateForm, maxFormsReached } = useSupabaseForms(user);
  
  const {
    fields,
    currentForm,
    setCurrentForm,
    loadForm,
    selectTemplate,
  } = useFormBuilder({
    initialFields: [],
    initialCurrentForm: null,
  });

  const {
    handleLoadForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleShareForm,
    handleUpdateForm,
  } = useFormHandlers({
    maxFormsReached,
    saveForm,
    deleteForm,
    updateForm,
    fields,
    currentForm,
    setCurrentForm,
    onLoadForm: loadForm,
    onSelectTemplate: selectTemplate,
  });

  return (
    <div className="h-full p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">My Forms</h1>
        <p className="text-muted-foreground">Manage your saved forms</p>
      </div>
      
      <FormManager
        savedForms={savedForms}
        onLoadForm={handleLoadForm}
        onDeleteForm={handleDeleteForm}
        onDuplicateForm={handleDuplicateForm}
        onShareForm={handleShareForm}
        onUpdateForm={handleUpdateForm}
      />
    </div>
  );
}