
import React, { useState, useEffect } from 'react';
import { FormField, FormSubmission } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormFieldRenderer } from './form-preview/FormFieldRenderer';
import { useFormSubmission } from './form-preview/FormSubmissionHandler';
import { EmptyFormState } from './form-preview/EmptyFormState';
import { Send, CheckCircle } from 'lucide-react';

interface FormPreviewProps {
  fields: FormField[];
  formId?: string;
  onSubmissionSuccess?: () => void;
}

export const FormPreview = ({ fields, formId, onSubmissionSuccess }: FormPreviewProps) => {
  const [formData, setFormData] = useState<FormSubmission>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = () => {
    console.log('Resetting form data and state');
    setFormData({});
    setErrors({});
    setIsSubmitted(false);
    setIsSubmitting(false);
  };

  const handleSubmissionSuccess = () => {
    console.log('Form submission successful, resetting form');
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after a short delay to show success state
    setTimeout(() => {
      resetForm();
    }, 2000);
    
    // Call parent callback if provided
    if (onSubmissionSuccess) {
      console.log('Calling parent submission success callback');
      onSubmissionSuccess();
    }
  };

  const { handleSubmit } = useFormSubmission({ 
    fields, 
    formData, 
    setErrors, 
    formId,
    onSubmissionSuccess: handleSubmissionSuccess,
    setIsSubmitting
  });

  const updateFormData = (fieldId: string, value: string | string[] | boolean) => {
    console.log('Updating form data for field:', fieldId, 'with value:', value);
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear any existing error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Reset form when fields change (new form loaded)
  useEffect(() => {
    console.log('Fields changed, resetting form state');
    resetForm();
  }, [fields]);

  if (fields.length === 0) {
    return <EmptyFormState />;
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Form Submitted Successfully!
        </h3>
        <p className="text-gray-600">
          Thank you for your submission. The form will reset automatically.
        </p>
      </Card>
    );
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
        
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Form
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
