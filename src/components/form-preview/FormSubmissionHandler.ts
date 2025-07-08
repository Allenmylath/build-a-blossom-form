
import { supabase } from '@/integrations/supabase/client';
import { FormSubmission } from '@/types/form';

export const FormSubmissionHandler = {
  submitForm: async (formId: string, formData: FormSubmission) => {
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
      throw new Error('Failed to save form submission');
    }

    console.log('Form submission saved successfully:', data);
    return data[0];
  }
};
