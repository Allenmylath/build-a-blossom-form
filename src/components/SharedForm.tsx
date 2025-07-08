
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FormPreview } from './FormPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SavedForm } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

export const SharedForm = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<SavedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SharedForm component mounted');
    console.log('URL params:', { id });
    console.log('Window location:', window.location.href);
    
    const fetchSharedForm = async () => {
      if (!id) {
        console.log('No ID provided in URL params');
        setError('Form ID is required');
        setLoading(false);
        return;
      }

      try {
        console.log('Attempting to fetch form with ID:', id);
        
        // Try to fetch the form regardless of is_public first to see if it exists
        const { data: allData, error: allError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id);

        console.log('All forms query result:', { allData, allError });

        // Now try the public form query with submissions included
        const { data, error } = await supabase
          .from('forms')
          .select(`
            *,
            form_submissions (
              id,
              data,
              submitted_at,
              ip_address,
              user_id,
              submission_type,
              completion_time_seconds,
              total_interactions,
              chat_session_references,
              metadata
            )
          `)
          .eq('id', id)
          .eq('is_public', true)
          .single();

        console.log('Public form query result:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          if (allData && allData.length > 0) {
            setError('This form exists but is not publicly available');
          } else {
            setError('Form not found');
          }
          return;
        }

        if (!data) {
          console.log('No data returned from query');
          setError('Form not found');
          return;
        }

        console.log('Successfully fetched form data:', data);
        console.log('Form submissions data:', data.form_submissions);

        // Map the submissions properly - including the required formId
        const submissions = (data.form_submissions || []).map((sub: any) => ({
          id: sub.id,
          formId: data.id, // Add the required formId property
          data: sub.data || {},
          submittedAt: sub.submitted_at,
          ipAddress: sub.ip_address,
          userId: sub.user_id,
          submissionType: sub.submission_type || 'traditional',
          completionTimeSeconds: sub.completion_time_seconds,
          totalInteractions: sub.total_interactions || 1,
          chatSessionReferences: sub.chat_session_references || [],
          metadata: sub.metadata || {}
        }));

        const mappedForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: (data.fields as any) || [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: data.share_url,
          submissions: submissions,
        };

        console.log('Mapped form for display:', mappedForm);
        console.log('Form submissions count:', submissions.length);
        setForm(mappedForm);
      } catch (err) {
        console.error('Error in fetchSharedForm:', err);
        setError('Failed to load form due to an unexpected error');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedForm();
  }, [id]);

  console.log('Current state:', { form, loading, error, id });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading form...</p>
          <p className="text-sm text-gray-400 mt-2">Form ID: {id}</p>
          <p className="text-xs text-gray-300 mt-1">URL: {window.location.href}</p>
        </Card>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Form Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'The form you\'re looking for doesn\'t exist or is not publicly available.'}
          </p>
          <p className="text-sm text-gray-400 mb-2">Form ID: {id}</p>
          <p className="text-xs text-gray-300 mb-4">URL: {window.location.href}</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-gray-600 mb-4">{form.description}</p>
          )}
          <p className="text-sm text-gray-500">
            Shared by: Form Builder • {form.fields.length} fields • {form.submissions.length} submissions
          </p>
        </Card>
        
        <FormPreview fields={form.fields} formId={form.id} />
      </div>
    </div>
  );
};
