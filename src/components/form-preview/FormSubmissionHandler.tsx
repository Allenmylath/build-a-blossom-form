
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
}

export const useFormSubmission = ({ 
  fields, 
  formData, 
  setErrors, 
  formId,
  onSubmissionSuccess 
}: UseFormSubmissionProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm(fields, formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      
      // Save to database if we have a form ID
      if (formId) {
        try {
          console.log('Saving submission to database for form:', formId);
          
          // Get user's IP address (simplified - in production you might want a more robust solution)
          const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
          const ipData = ipResponse ? await ipResponse.json().catch(() => null) : null;
          
          const submissionData = {
            form_id: formId,
            data: formData,
            ip_address: ipData?.ip || null,
          };
          
          console.log('Submitting data:', submissionData);
          
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

          // Extract the submission ID for proof
          const submissionId = data[0]?.id;
          const submissionReference = submissionId ? submissionId.slice(0, 8).toUpperCase() : 'UNKNOWN';

          toast({
            title: "Form Submitted Successfully!",
            description: `Your response has been recorded. Reference #${submissionReference}`,
          });

          // Call success callback with proper delay and retry mechanism
          if (onSubmissionSuccess) {
            console.log('Calling submission success callback after successful save');
            
            // Wait longer to ensure database write is fully committed
            setTimeout(async () => {
              try {
                await onSubmissionSuccess();
              } catch (error) {
                console.error('Error in submission success callback:', error);
                // Retry once after additional delay
                setTimeout(() => {
                  try {
                    onSubmissionSuccess();
                  } catch (retryError) {
                    console.error('Retry also failed:', retryError);
                  }
                }, 1000);
              }
            }, 1500); // Increased from 100ms to 1500ms
          }
        } catch (error) {
          console.error('Network error during form submission:', error);
          toast({
            title: "Network Error",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      } else {
        // For forms without ID (preview mode), just show success message with mock reference
        const mockReference = Date.now().toString().slice(-6).toUpperCase();
        toast({
          title: "Form Submitted Successfully!",
          description: `This is a preview - Reference #PREV${mockReference}`,
        });
      }
    }
  };

  return { handleSubmit };
};
