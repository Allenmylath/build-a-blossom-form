
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lock } from 'lucide-react';
import { FormCardVisibilityToggle } from './FormCardVisibilityToggle';
import { FormCardActions } from './FormCardActions';

interface FormCardProps {
  form: SavedForm;
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
  onShowAnalytics: (form: SavedForm) => void;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => void;
}

export const FormCard = ({ 
  form, 
  onLoadForm, 
  onDeleteForm, 
  onDuplicateForm, 
  onShareForm, 
  onShowAnalytics,
  onUpdateForm 
}: FormCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-purple-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-lg truncate">{form.name}</h3>
              {form.isPublic ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
            {form.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{form.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">{form.fields.length} fields</span>
            <span className="font-medium">{form.submissions.length} responses</span>
          </div>
        </div>

        <FormCardVisibilityToggle form={form} onUpdateForm={onUpdateForm} />

        <FormCardActions
          form={form}
          onLoadForm={onLoadForm}
          onDeleteForm={onDeleteForm}
          onDuplicateForm={onDuplicateForm}
          onShareForm={onShareForm}
          onShowAnalytics={onShowAnalytics}
        />
      </div>
    </Card>
  );
};
