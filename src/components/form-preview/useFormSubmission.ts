
import { useState } from 'react';
import { FormField, FormSubmission } from '@/types/form';
import { FormValidation } from './FormValidation';
import { FormSubmissionHandler } from './FormSubmissionHandler';
import { toast } from 'sonner';

interface UseFormSubmissionProps {
  fields: FormField[];
  formData: Record<string, any>;
  setErrors: (errors: Record<string, string>) => void;
  formId?: string;
  onSubmissionSuccess?: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export const useFormSubmission = ({
  fields,
  formData,
  setErrors,
  formId,
  onSubmissionSuccess,
  setIsSubmitting
}: UseFormSubmissionProps) => {
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
      if (formId) {
        await FormSubmissionHandler.submitForm(formId, formData);
        toast.success('Form submitted successfully!');
        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};
