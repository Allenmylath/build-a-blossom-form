import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Eye, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FormField } from '@/types/form';

interface ChatForm {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
  share_url: string | null;
  _chatFieldsCount: number;
  _totalSubmissions: number;
  _chatSessions: number;
}

export default function ChatForms({ user }: { user: any }) {
  const [chatForms, setChatForms] = useState<ChatForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChatForms();
  }, [user]);

  const fetchChatForms = async () => {
    try {
      setLoading(true);
      
      // Fetch all forms for the user
      const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select(`
          id,
          name,
          description,
          fields,
          created_at,
          updated_at,
          is_public,
          share_url
        `)
        .eq('user_id', user.id);

      if (formsError) throw formsError;

      // Filter forms that contain chat fields and get additional data
      const chatFormsWithData = await Promise.all(
        forms
          .filter(form => {
            try {
              const fields = Array.isArray(form.fields) ? form.fields as unknown as FormField[] : [];
              return fields.some((field: any) => field.type === 'chat');
            } catch {
              return false;
            }
          })
          .map(async (form) => {
            try {
              const fields = Array.isArray(form.fields) ? form.fields as unknown as FormField[] : [];
              const chatFieldsCount = fields.filter((field: any) => field.type === 'chat').length;

              // Get submission count
              const { count: submissionCount } = await supabase
                .from('form_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);

              // Get chat sessions count
              const { count: chatSessionsCount } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);

              return {
                ...form,
                fields: fields,
                _chatFieldsCount: chatFieldsCount,
                _totalSubmissions: submissionCount || 0,
                _chatSessions: chatSessionsCount || 0,
              } as ChatForm;
            } catch {
              return null;
            }
          })
      );

      // Filter out any null results
      const validChatForms = chatFormsWithData.filter(form => form !== null) as ChatForm[];
      setChatForms(validChatForms);
    } catch (error) {
      console.error('Error fetching chat forms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (form: ChatForm) => {
    if (form.share_url) {
      window.open(form.share_url, '_blank');
    } else {
      // Create a temporary share URL or navigate to form preview
      window.open(`/form/${form.id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chat Forms</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (chatForms.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chat Forms</h1>
        </div>
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Chat Forms Found</CardTitle>
            <CardDescription>
              You haven't created any forms with chat fields yet. Go to the Form Builder and add a chat field to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>
              Create Your First Chat Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chat Forms</h1>
          <Badge variant="secondary">{chatForms.length}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chatForms.map((form) => (
          <Card key={form.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{form.name}</CardTitle>
                  {form.description && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {form.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  {form.is_public && (
                    <Badge variant="outline" className="text-xs">Public</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {form._chatFieldsCount} Chat Field{form._chatFieldsCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{form._totalSubmissions} submissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{form._chatSessions} chats</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {format(new Date(form.created_at), 'MMM dd, yyyy')}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewForm(form)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Form
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = `/forms`}
                    className="flex-1"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}