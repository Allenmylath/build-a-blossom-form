
import { useState } from 'react';
import { SavedForm } from '@/types/form';
import { FormAnalytics } from './FormAnalytics';
import { FormManagerHeader } from './form-manager/FormManagerHeader';
import { EmptyFormsState } from './form-manager/EmptyFormsState';
import { FormCard } from './form-manager/FormCard';

interface FormManagerProps {
  savedForms: SavedForm[];
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
}

export const FormManager = ({ 
  savedForms, 
  onLoadForm, 
  onDeleteForm, 
  onDuplicateForm,
  onShareForm,
  onUpdateForm 
}: FormManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState<SavedForm | null>(null);

  const filteredForms = savedForms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAnalytics) {
    return (
      <FormAnalytics 
        form={showAnalytics} 
        onClose={() => setShowAnalytics(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <FormManagerHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      {filteredForms.length === 0 ? (
        <EmptyFormsState searchTerm={searchTerm} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => (
            <FormCard
              key={form.id}
              form={form}
              onLoadForm={onLoadForm}
              onDeleteForm={onDeleteForm}
              onDuplicateForm={onDuplicateForm}
              onShareForm={onShareForm}
              onShowAnalytics={setShowAnalytics}
              onUpdateForm={onUpdateForm}
            />
          ))}
        </div>
      )}
    </div>
  );
};
