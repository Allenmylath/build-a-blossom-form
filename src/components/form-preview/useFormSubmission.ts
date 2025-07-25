
import { useState } from 'react';
import { FormField } from '@/types/form';
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
const separateFormData = (formData: Record<string, any>, fields: FormField[]) => {
  const traditionalData: Record<string, any> = {};
  const chatSessionIds: string[] = [];

  fields.forEach(field => {
    const value = formData[field.id];
    
    if (field.type === 'chat' && value?.sessionId) {
      // Chat field - extract session ID for linking
      chatSessionIds.push(value.sessionId);
    } else if (value !== undefined) {
      // Traditional field - include in submission data
      traditionalData[field.id] = value;
    }
  });

  return { traditionalData, chatSessionIds };
};
export const useFormSubmission = ({
  fields,
  formData,
  setErrors,
  formId,
  onSubmissionSuccess,
  setIsSubmitting
}: UseFormSubmissionProps) => {
  const [submissionInProgress, setSubmissionInProgress] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (submissionInProgress) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }

    const validation = FormValidation.validateForm(fields, formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    setSubmissionInProgress(true);
    
    try {
      if (formId) {
        console.log('Submitting form data:', { formId, formData });
        
        await FormSubmissionHandler.submitForm(formId, formData);
        
        console.log('Form submitted successfully');
        toast.success('Form submitted successfully!');
        
        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        }
      } else {
        console.error('No form ID provided for submission');
        toast.error('Form configuration error: No form ID');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = 'Failed to submit form. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('violates row-level security')) {
          errorMessage = 'You do not have permission to submit this form.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmissionInProgress(false);
    }
  };

  return { handleSubmit };
};
