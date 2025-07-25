
import React, { useState } from 'react';
import { FormField, FormSubmission, SavedForm } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormFieldRenderer } from '@/components/form-preview/FormFieldRenderer';
import { FormSubmissionHandler } from '@/components/form-preview/FormSubmissionHandler';
import { FormValidation } from '@/components/form-preview/FormValidation';
import { EmptyFormState } from '@/components/form-preview/EmptyFormState';
import { MultiPageForm } from '@/components/MultiPageForm';
import { toast } from 'sonner';

interface FormPreviewProps {
  fields: FormField[];
  onSubmit?: (data: FormSubmission) => void;
  title?: string;
  description?: string;
  savedForm?: SavedForm;
  formId?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ 
  fields, 
  onSubmit, 
  title = "Form Preview", 
  description,
  savedForm,
  formId
}) => {
  const [formData, setFormData] = useState<FormSubmission>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = FormValidation.validateForm(fields, formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      const targetFormId = savedForm?.id || formId;
      if (targetFormId) {
        await FormSubmissionHandler.submitForm(targetFormId, formData);
        toast.success('Form submitted successfully!');
        setFormData({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fields.length === 0) {
    return <EmptyFormState />;
  }

  // Check if form has page breaks
  const hasPageBreaks = fields.some(field => field.type === 'page-break');

  // If form has page breaks, use MultiPageForm component
  if (hasPageBreaks) {
    const handleSubmissionSuccess = () => {
      toast.success('Form submitted successfully!');
    };

    return (
      <div className="w-full max-w-4xl mx-auto">
        {(title !== "Form Preview" || description) && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </Card>
        )}
        <MultiPageForm 
          fields={fields} 
          formId={savedForm?.id || formId}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      </div>
    );
  }

  // For single-page forms, use the original layout
  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            formId={savedForm?.id || formId}
          />
        ))}
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
      </form>
    </Card>
  );
};
