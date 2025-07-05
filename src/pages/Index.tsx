import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { FormBuilder } from '@/components/FormBuilder';
import { FormPreview } from '@/components/FormPreview';
import { FormManager } from '@/components/FormManager';
import { FormAnalytics } from '@/components/FormAnalytics';
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

  // Synchronize fields when currentForm changes
  useEffect(() => {
    if (currentForm && Array.isArray(currentForm.fields)) {
      console.log('Current form changed, updating fields:', currentForm.name, 'with', currentForm.fields.length, 'fields');
      setFields([...currentForm.fields]); // Create new array to trigger re-renders
    } else if (currentForm === null) {
      console.log('Current form cleared, resetting fields');
      setFields([]);
    }
  }, [currentForm]);

  const handleSaveForm = useCallback(async (formData: { name: string; description: string; isPublic: boolean }) => {
    try {
      console.log('Saving form with data:', formData, 'and', fields.length, 'fields');
      
      if (fields.length === 0) {
        toast({
          title: "No Fields",
          description: "Please add at least one field before saving the form.",
          variant: "destructive",
        });
        return;
      }
      
      const savedForm = await saveForm(formData, fields, currentForm || undefined);
      if (savedForm) {
        console.log('Form saved successfully, updating current form');
        setCurrentForm(savedForm);
        toast({
          title: "Form Saved",
          description: `"${formData.name}" has been saved successfully.`,
        });
      }
    } catch (error) {
      console.error('Error in handleSaveForm:', error);
      toast({
        title: "Save Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
    }
  }, [fields, currentForm, saveForm]);

  const handleLoadForm = useCallback((form: SavedForm) => {
    try {
      console.log('Loading form:', form.name, 'with', form.fields.length, 'fields');
      
      if (!Array.isArray(form.fields)) {
        console.error('Invalid form fields data:', form.fields);
        toast({
          title: "Invalid Form",
          description: "This form has corrupted data and cannot be loaded.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentForm(form);
      setFields([...form.fields]); // Ensure we create a new array reference
      setActiveTab('builder');
      
      toast({
        title: "Form Loaded",
        description: `"${form.name}" is now ready for editing.`,
      });
    } catch (error) {
      console.error('Error in handleLoadForm:', error);
      toast({
        title: "Load Error",
        description: "Failed to load form. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const handleDeleteForm = useCallback(async (formId: string) => {
    try {
      console.log('Deleting form:', formId);
      
      const deletedForm = savedForms.find(f => f.id === formId);
      await deleteForm(formId);
      
      // Clear current form and fields if we deleted the currently loaded form
      if (currentForm?.id === formId) {
        console.log('Deleted form was currently loaded, clearing state');
        setCurrentForm(null);
        setFields([]);
      }
      
      if (deletedForm) {
        toast({
          title: "Form Deleted",
          description: `"${deletedForm.name}" has been deleted successfully.`,
        });
      }
    } catch (error) {
      console.error('Error in handleDeleteForm:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    }
  }, [savedForms, currentForm, deleteForm]);

  const handleDuplicateForm = useCallback(async (form: SavedForm) => {
    try {
      console.log('Duplicating form:', form.name);
      
      if (!Array.isArray(form.fields)) {
        toast({
          title: "Invalid Form",
          description: "This form has corrupted data and cannot be duplicated.",
          variant: "destructive",
        });
        return;
      }
      
      const duplicatedName = `${form.name} (Copy)`;
      const savedForm = await saveForm({ 
        name: duplicatedName, 
        description: form.description || '', 
        isPublic: form.isPublic 
      }, form.fields);
      
      if (savedForm) {
        toast({
          title: "Form Duplicated",
          description: `"${duplicatedName}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Error in handleDuplicateForm:', error);
      toast({
        title: "Duplicate Error",
        description: "Failed to duplicate form. Please try again.",
        variant: "destructive",
      });
    }
  }, [saveForm]);

  const handleShareForm = useCallback((form: SavedForm) => {
    try {
      console.log('Sharing form:', form.name);
      
      if (form.shareUrl) {
        navigator.clipboard.writeText(form.shareUrl);
        toast({
          title: "Share Link Copied",
          description: "The form share link has been copied to your clipboard.",
        });
      } else {
        toast({
          title: "No Share Link",
          description: "This form doesn't have a share link yet. Please save it first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleShareForm:', error);
      toast({
        title: "Share Error",
        description: "Failed to copy share link. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const exportToCSV = useCallback(() => {
    try {
      if (!currentForm || currentForm.submissions.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no submissions to export for this form.",
          variant: "destructive",
        });
        return;
      }

      console.log('Exporting CSV for form:', currentForm.name, 'with', currentForm.submissions.length, 'submissions');

      const headers = ['Date', 'IP Address', 'Reference ID', ...fields.map(field => field.label)];
      const rows = currentForm.submissions.map(submission => [
        new Date(submission.submittedAt).toLocaleString(),
        submission.ipAddress || 'N/A',
        submission.id.slice(0, 8).toUpperCase(),
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Exported",
        description: "Form submissions have been exported successfully.",
      });
    } catch (error) {
      console.error('Error in exportToCSV:', error);
      toast({
        title: "Export Error",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentForm, fields]);

  const handleFormSubmissionSuccess = useCallback(async () => {
    try {
      console.log('Form submission success callback triggered');
      
      if (!currentForm) {
        console.log('No current form to refresh');
        return;
      }

      setIsRefreshing(true);
      
      console.log('Refreshing form data after submission for form:', currentForm.id);
      
      // Use refreshSingleForm for targeted update
      const updatedForm = await refreshSingleForm(currentForm.id);
      
      if (updatedForm) {
        console.log('Successfully refreshed form with updated submissions:', updatedForm.submissions.length);
        setCurrentForm(updatedForm);
        
        // Get the latest submission for reference
        const latestSubmission = updatedForm.submissions[updatedForm.submissions.length - 1];
        const submissionReference = latestSubmission?.id?.slice(0, 8).toUpperCase() || 'UNKNOWN';
        
        toast({
          title: "Analytics Updated",
          description: `Latest submission #${submissionReference} is now visible in analytics. Total: ${updatedForm.submissions.length}`,
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
  }, [currentForm, refreshSingleForm, refreshForms]);

  const handleNewForm = useCallback(() => {
    try {
      console.log('Starting new form');
      setFields([]);
      setCurrentForm(null);
      setActiveTab('builder');
      
      toast({
        title: "New Form",
        description: "You can now start building your new form.",
      });
    } catch (error) {
      console.error('Error in handleNewForm:', error);
    }
  }, []);

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
                onClick={handleNewForm}
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
            {currentForm ? (
              <FormAnalytics
                form={currentForm}
                onClose={() => setActiveTab('builder')}
              />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Form Selected</h3>
                <p className="text-gray-500 mb-4">
                  Please select a form from the Forms tab or create a new one to view analytics.
                </p>
                <div className="space-x-4">
                  <Button onClick={() => setActiveTab('forms')}>View Forms</Button>
                  <Button onClick={handleNewForm} variant="outline">Create New Form</Button>
                </div>
              </div>
            )}
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
