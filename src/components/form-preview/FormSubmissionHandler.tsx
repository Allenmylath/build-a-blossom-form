
import { FormField, FormSubmission } from '@/types/form';
import { validateForm } from './FormValidation';
import { toast } from '@/hooks/use-toast';

interface UseFormSubmissionProps {
  fields: FormField[];
  formData: FormSubmission;
  setErrors: (errors: Record<string, string>) => void;
}

export const useFormSubmission = ({ fields, formData, setErrors }: UseFormSubmissionProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm(fields, formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      toast({
        title: "Form Submitted Successfully!",
        description: "Check the console to see the submitted data.",
      });
    }
  };

  return { handleSubmit };
};
