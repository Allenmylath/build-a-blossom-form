
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { FormBuilder } from '@/components/FormBuilder';
import { FormPreview } from '@/components/FormPreview';
import { FormManager } from '@/components/FormManager';
import { FormSubmissionViewer } from '@/components/FormSubmissionViewer';
import { Auth } from '@/components/Auth';
import { FormField, SavedForm } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Eye, Settings, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useSupabaseAuth();
  const { savedForms, saveForm, deleteForm, refreshForms, refreshSingleForm } = useSupabaseForms(user);
  
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentForm, setCurrentForm] = useState<SavedForm | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      refreshForms();
    }
  }, [user, refreshForms]);

  // Update fields when currentForm changes
  useEffect(() => {
    if (currentForm) {
      setFields(currentForm.fields);
    }
  }, [currentForm]);

  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean }) => {
    const savedForm = await saveForm(formData, fields, currentForm || undefined);
    if (savedForm) {
      setCurrentForm(savedForm);
      toast({
        title: "Form Saved",
        description: `"${formData.name}" has been saved successfully.`,
      });
    }
  };

  const handleLoadForm = (form: SavedForm) => {
    setFields(form.fields);
    setCurrentForm(form);
    setActiveTab('builder');
  };

  const handleDeleteForm = (formId: string) => {
    deleteForm(formId);
    const deletedForm = savedForms.find(f => f.id === formId);
    if (currentForm?.id === formId) {
      setCurrentForm(null);
      setFields([]);
    }
  };

  const handleDuplicateForm = (form: SavedForm) => {
    const duplicatedName = `${form.name} (Copy)`;
    setFields([...form.fields]);
    setCurrentForm(null);
    handleSaveForm({ 
      name: duplicatedName, 
      description: form.description || '', 
      isPublic: form.isPublic 
    });
  };

  const handleShareForm = (form: SavedForm) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
      toast({
        title: "Share Link Copied",
        description: "The form share link has been copied to your clipboard.",
      });
    }
  };

  const exportToCSV = () => {
    if (!currentForm || currentForm.submissions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no submissions to export for this form.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date', 'IP Address', ...fields.map(field => field.label)];
    const rows = currentForm.submissions.map(submission => [
      new Date(submission.submittedAt).toLocaleString(),
      submission.ipAddress || 'N/A',
      ...fields.map(field => {
        const value = submission.data[field.id];
        return Array.isArray(value) ? value.join(', ') : (value || '');
      })
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentForm.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Exported",
      description: "Form submissions have been exported successfully.",
    });
  };

  const handleFormSubmissionSuccess = async () => {
    console.log('Form submission success callback triggered');
    
    if (!currentForm) {
      console.log('No current form to refresh');
      return;
    }

    setIsRefreshing(true);
    
    try {
      console.log('Refreshing form data after submission for form:', currentForm.id);
      
      // Use refreshSingleForm for targeted update
      const updatedForm = await refreshSingleForm(currentForm.id);
      
      if (updatedForm) {
        console.log('Successfully refreshed form with updated submissions:', updatedForm.submissions.length);
        setCurrentForm(updatedForm);
        
        toast({
          title: "Submission Recorded",
          description: `Form submission saved successfully. Total submissions: ${updatedForm.submissions.length}`,
        });
      } else {
        console.log('Failed to refresh form, falling back to full refresh');
        // Fallback to full refresh if single form refresh fails
        const allForms = await refreshForms();
        const refreshedForm = allForms.find(f => f.id === currentForm.id);
        if (refreshedForm) {
          setCurrentForm(refreshedForm);
        }
      }
    } catch (error) {
      console.error('Error refreshing form data after submission:', error);
      toast({
        title: "Refresh Error",
        description: "Submission saved but analytics may not be updated immediately.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAuthChange = (newUser: any) => {
    // This function is required by the Auth component but we handle auth state in useSupabaseAuth
    console.log('Auth state changed:', newUser);
  };

  if (!user) {
    return <Auth onAuthChange={handleAuthChange} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600">Create, customize, and manage your forms</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  setFields([]);
                  setCurrentForm(null);
                  setActiveTab('builder');
                }}
                className="flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Form
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
              {currentForm && currentForm.submissions.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {currentForm.submissions.length}
                </span>
              )}
              {isRefreshing && (
                <span className="ml-1 animate-spin">⟳</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center">
              Forms ({savedForms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <FormBuilder 
              onSave={handleSaveForm}
              currentForm={currentForm}
              user={user}
              fields={fields}
              setFields={setFields}
            />
          </TabsContent>

          <TabsContent value="preview">
            <FormPreview 
              fields={fields} 
              formId={currentForm?.id}
              onSubmissionSuccess={handleFormSubmissionSuccess}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <FormSubmissionViewer
              submissions={currentForm?.submissions || []}
              fields={fields}
              onExportCSV={exportToCSV}
              isRefreshing={isRefreshing}
            />
          </TabsContent>

          <TabsContent value="forms">
            <FormManager
              savedForms={savedForms}
              onLoadForm={handleLoadForm}
              onDeleteForm={handleDeleteForm}
              onDuplicateForm={handleDuplicateForm}
              onShareForm={handleShareForm}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
