
import { FormField, FormSubmission } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Send } from 'lucide-react';
import { useState } from 'react';
import { FormFieldRenderer } from './form-preview/FormFieldRenderer';
import { useFormSubmission } from './form-preview/FormSubmissionHandler';
import { EmptyFormState } from './form-preview/EmptyFormState';

interface FormPreviewProps {
  fields: FormField[];
}

export const FormPreview = ({ fields }: FormPreviewProps) => {
  const [formData, setFormData] = useState<FormSubmission>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleSubmit } = useFormSubmission({ fields, formData, setErrors });

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  return (
    <Card className="p-6 bg-white shadow-lg sticky top-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        Form Preview
      </h3>
      
      {fields.length === 0 ? (
        <EmptyFormState />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(field => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={formData[field.id]}
              error={errors[field.id]}
              onChange={(value) => updateFormData(field.id, value)}
            />
          ))}
          
          <Button type="submit" className="w-full flex items-center justify-center">
            <Send className="w-4 h-4 mr-2" />
            Submit Form
          </Button>
        </form>
      )}
    </Card>
  );
};
