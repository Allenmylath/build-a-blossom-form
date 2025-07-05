
import { FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { MultiPageForm } from './MultiPageForm';
import { EmptyFormState } from './form-preview/EmptyFormState';

interface FormPreviewProps {
  fields: FormField[];
}

export const FormPreview = ({ fields }: FormPreviewProps) => {
  // Filter out page-break fields for display count
  const displayFields = fields.filter(f => f.type !== 'page-break');
  
  return (
    <Card className="p-6 bg-white shadow-lg sticky top-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        Form Preview
      </h3>
      
      {displayFields.length === 0 ? (
        <EmptyFormState />
      ) : (
        <MultiPageForm fields={fields} />
      )}
    </Card>
  );
};
