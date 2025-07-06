
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
    
    console.log('Starting form submission process');
    console.log('Form ID:', formId);
    console.log('Form data:', formData);
    
    if (setIsSubmitting) {
      setIsSubmitting(true);
    }
    
    try {
      // Validate form data
      const newErrors = validateForm(fields, formData);
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) {
        console.log('Form validation failed:', newErrors);
        
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted errors before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Form validation passed, submitting data:', formData);
      
      // ALWAYS save to database - no more mock/preview mode
      if (!formId) {
        console.error('No form ID provided - cannot submit without a form ID');
        toast({
          title: "Configuration Error",
          description: "Form ID is required for submission. Please use a shared form link.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log('Saving submission to database for form:', formId);
        
        // Get user's IP address (simplified - in production you might want a more robust solution)
        let ipAddress = null;
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData?.ip || null;
          console.log('Retrieved IP address:', ipAddress);
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
          
          toast({
            title: "Submission Error",
            description: "There was an error saving your submission. Please try again.",
            variant: "destructive",
          });
          return;
        }

        console.log('Form submission saved successfully:', data);

        // Extract the REAL submission ID from Supabase response
        const submissionId = data[0]?.id;
        if (!submissionId) {
          console.error('No submission ID returned from Supabase');
          toast({
            title: "Submission Error",
            description: "Submission saved but could not retrieve confirmation ID.",
            variant: "destructive",
          });
          return;
        }

        // Create reference from the real Supabase ID (first 8 characters)
        const submissionReference = submissionId.slice(0, 8).toUpperCase();
        console.log('Real Supabase submission ID:', submissionId);
        console.log('Reference ID shown to user:', submissionReference);

        toast({
          title: "Form Submitted Successfully!",
          description: `Your response has been recorded. Reference #${submissionReference}`,
        });

        // Call success callback AFTER successful database save
        if (onSubmissionSuccess) {
          console.log('Calling submission success callback after database save');
          // Give a small delay to ensure the database transaction is fully committed
          setTimeout(() => {
            onSubmissionSuccess();
          }, 1000);
        }
      } catch (error) {
        console.error('Network error during form submission:', error);
        
        toast({
          title: "Network Error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error during form submission:', error);
      
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always reset submitting state in the finally block
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  return { handleSubmit };
};
