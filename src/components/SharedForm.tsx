
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
    console.log('SharedForm component mounted with ID:', id);
    
    const fetchSharedForm = async () => {
      if (!id) {
        console.log('No ID provided');
        setError('Form ID is required');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching form with ID:', id);
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .eq('is_public', true)
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          setError('Form not found or not publicly available');
          return;
        }

        const mappedForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: (data.fields as any) || [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: data.share_url,
          submissions: [],
        };

        console.log('Mapped form:', mappedForm);
        setForm(mappedForm);
      } catch (err) {
        console.error('Error fetching shared form:', err);
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedForm();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading form...</p>
          <p className="text-sm text-gray-400 mt-2">Form ID: {id}</p>
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
          <p className="text-sm text-gray-400 mb-4">Form ID: {id}</p>
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
            Shared by: Form Builder • {form.fields.length} fields
          </p>
        </Card>
        
        <FormPreview fields={form.fields} />
      </div>
    </div>
  );
};
