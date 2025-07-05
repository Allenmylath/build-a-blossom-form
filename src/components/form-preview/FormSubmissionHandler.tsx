
import { FormField, FormSubmission } from '@/types/form';
import { validateForm } from './FormValidation';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseFormSubmissionProps {
  fields: FormField[];
  formData: FormSubmission;
  setErrors: (errors: Record<string, string>) => void;
  formId?: string;
  onSubmissionSuccess?: () => void;
  setIsSubmitting?: (isSubmitting: boolean) => void;
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
    
    try {
      console.log('Starting form submission process');
      
      if (setIsSubmitting) {
        setIsSubmitting(true);
      }
      
      // Validate form data
      const newErrors = validateForm(fields, formData);
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) {
        console.log('Form validation failed:', newErrors);
        if (setIsSubmitting) {
          setIsSubmitting(false);
        }
        
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted errors before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Form validation passed, submitting data:', formData);
      
      // Save to database if we have a form ID
      if (formId) {
        try {
          console.log('Saving submission to database for form:', formId);
          
          // Get user's IP address (simplified - in production you might want a more robust solution)
          let ipAddress = null;
          try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData?.ip || null;
          } catch (ipError) {
            console.log('Could not fetch IP address:', ipError);
          }
          
          const submissionData = {
            form_id: formId,
            data: formData,
            ip_address: ipAddress,
          };
          
          console.log('Submitting data to Supabase:', submissionData);
          
          const { data, error } = await supabase
            .from('form_submissions')
            .insert(submissionData)
            .select();

          if (error) {
            console.error('Error saving form submission:', error);
            if (setIsSubmitting) {
              setIsSubmitting(false);
            }
            
            toast({
              title: "Submission Error",
              description: "There was an error saving your submission. Please try again.",
              variant: "destructive",
            });
            return;
          }

          console.log('Form submission saved successfully:', data);

          // Extract the submission ID for proof
          const submissionId = data[0]?.id;
          const submissionReference = submissionId ? submissionId.slice(0, 8).toUpperCase() : 'UNKNOWN';

          toast({
            title: "Form Submitted Successfully!",
            description: `Your response has been recorded. Reference #${submissionReference}`,
          });

          // Call success callback
          if (onSubmissionSuccess) {
            console.log('Calling submission success callback');
            setTimeout(() => {
              onSubmissionSuccess();
            }, 500); // Small delay to ensure toast is shown
          }
        } catch (error) {
          console.error('Network error during form submission:', error);
          if (setIsSubmitting) {
            setIsSubmitting(false);
          }
          
          toast({
            title: "Network Error",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      } else {
        // For forms without ID (preview mode), just show success message
        const mockReference = Date.now().toString().slice(-6).toUpperCase();
        
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Form Submitted Successfully!",
          description: `This is a preview - Reference #PREV${mockReference}`,
        });
        
        if (onSubmissionSuccess) {
          console.log('Calling submission success callback for preview mode');
          onSubmissionSuccess();
        }
      }
    } catch (error) {
      console.error('Unexpected error during form submission:', error);
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
      
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleSubmit };
};
