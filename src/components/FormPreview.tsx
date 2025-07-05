import React, { useState, useEffect } from 'react';
import { FormField, FormSubmission } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormFieldRenderer } from './form-preview/FormFieldRenderer';
import { useFormSubmission } from './form-preview/FormSubmissionHandler';
import { EmptyFormState } from './form-preview/EmptyFormState';
import { Send } from 'lucide-react';

interface FormPreviewProps {
  fields: FormField[];
  formId?: string;
  onSubmissionSuccess?: () => void;
}

export const FormPreview = ({ fields, formId, onSubmissionSuccess }: FormPreviewProps) => {
  const [formData, setFormData] = useState<FormSubmission>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleSubmit } = useFormSubmission({ 
    fields, 
    formData, 
    setErrors, 
    formId,
    onSubmissionSuccess 
  });

  const updateFormData = (fieldId: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  if (fields.length === 0) {
    return <EmptyFormState />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
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
        
        <Button type="submit" className="w-full" size="lg">
          <Send className="w-4 h-4 mr-2" />
          Submit Form
        </Button>
      </form>
    </Card>
  );
};
