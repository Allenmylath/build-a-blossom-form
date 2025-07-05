
import { FormField, FormSubmission } from '@/types/form';

export const validateForm = (fields: FormField[], formData: FormSubmission): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  fields.forEach(field => {
    if (field.required && !formData[field.id]) {
      errors[field.id] = `${field.label} is required`;
    }
    
    if (field.validation) {
      const value = formData[field.id] as string;
      if (value) {
        if (field.validation.min && value.length < field.validation.min) {
          errors[field.id] = `${field.label} must be at least ${field.validation.min} characters`;
        }
        if (field.validation.max && value.length > field.validation.max) {
          errors[field.id] = `${field.label} must be no more than ${field.validation.max} characters`;
        }
      }
    }
  });
  
  return errors;
};
