
import { useState } from 'react';
import { FormFieldEditor } from './FormFieldEditor';
import { FormPreview } from './FormPreview';
import { FormTemplates } from './FormTemplates';
import { FormManager } from './FormManager';
import { FormSaveDialog } from './FormSaveDialog';
import { FormExport } from './FormExport';
import { BuilderPanel } from './form-builder/BuilderPanel';
import { FormActions } from './form-builder/FormActions';
import { FormField, FormFieldType, FormTemplate, SavedForm } from '@/types/form';
import { Plus, Eye, FolderOpen, FileText, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ConversationalForm } from './ConversationalForm';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';
import { User } from '@supabase/supabase-js';

interface FormBuilderProps {
  user: User;
}

export const FormBuilder = ({ user }: FormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentForm, setCurrentForm] = useState<SavedForm | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { savedForms, loading, saveForm, deleteForm } = useSupabaseForms(user);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSaveForm = async (formData: { name: string; description: string; isPublic: boolean }) => {
    const savedFormData = await saveForm(formData, fields, currentForm || undefined);
    
    if (savedFormData) {
      setCurrentForm(savedFormData);
      toast({
        title: currentForm ? "Form Updated" : "Form Saved",
        description: `"${formData.name}" has been ${currentForm ? 'updated' : 'saved'} successfully.`,
      });
    }
  };

  const handleLoadForm = (form: SavedForm) => {
    setFields(form.fields);
    setCurrentForm(form);
    setSelectedFieldId(null);
    toast({
      title: "Form Loaded",
      description: `"${form.name}" is now ready for editing.`,
    });
  };

  const handleDeleteForm = async (formId: string) => {
    await deleteForm(formId);
    if (currentForm?.id === formId) {
      setCurrentForm(null);
    }
  };

  const handleDuplicateForm = async (form: SavedForm) => {
    const duplicatedFormData = await saveForm(
      {
        name: `${form.name} (Copy)`,
        description: form.description || '',
        isPublic: form.isPublic
      },
      form.fields
    );

    if (duplicatedFormData) {
      toast({
        title: "Form Duplicated",
        description: `"${form.name}" has been duplicated successfully.`,
      });
    }
  };

  const handleShareForm = (form: SavedForm) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
      toast({
        title: "Share Link Generated",
        description: "Form share link has been copied to clipboard.",
      });
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    setFields(template.fields);
    setSelectedFieldId(null);
    setCurrentForm(null);
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied to your form.`,
    });
  };

  const handleNewForm = () => {
    setFields([]);
    setSelectedFieldId(null);
    setCurrentForm(null);
    toast({
      title: "New Form Started",
      description: "You can now start building your new form.",
    });
  };

  const handleExportImport = (action: 'export' | 'import') => {
    if (action === 'export') {
      setShowExportDialog(true);
    } else {
      toast({
        title: "Import Feature",
        description: "Import functionality coming soon!",
      });
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          {currentForm && (
            <div className="text-right">
              <h2 className="font-semibold">{currentForm.name}</h2>
              <p className="text-sm text-gray-500">Last updated: {currentForm.updatedAt.toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="builder" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center">
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <FormActions
              onSave={() => setShowSaveDialog(true)}
              onNew={handleNewForm}
              onExportImport={handleExportImport}
              hasFields={fields.length > 0}
            />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <BuilderPanel
                fields={fields}
                selectedFieldId={selectedFieldId}
                onAddField={addField}
                onSelectField={setSelectedFieldId}
                onMoveField={moveField}
              />

              <div className="space-y-6">
                {selectedField && (
                  <FormFieldEditor
                    field={selectedField}
                    onUpdate={(updates) => updateField(selectedField.id, updates)}
                    onDelete={() => deleteField(selectedField.id)}
                  />
                )}
                <FormPreview fields={fields} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="max-w-2xl mx-auto">
              <FormPreview fields={fields} />
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <FormTemplates onSelectTemplate={handleSelectTemplate} />
          </TabsContent>

          <TabsContent value="manage">
            <FormManager
              savedForms={savedForms}
              onLoadForm={handleLoadForm}
              onDeleteForm={handleDeleteForm}
              onDuplicateForm={handleDuplicateForm}
              onShareForm={handleShareForm}
            />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 mr-2 text-purple-600" />
                Conversational Form
              </h2>
              <p className="text-gray-600">
                Advanced form with voice and text chat capabilities powered by AI bot
              </p>
            </div>
            <ConversationalForm />
          </TabsContent>
        </Tabs>
      </div>

      <FormSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveForm}
        initialData={currentForm ? {
          name: currentForm.name,
          description: currentForm.description || '',
          isPublic: currentForm.isPublic
        } : undefined}
      />

      <FormExport
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        fields={fields}
        formName={currentForm?.name || 'Untitled Form'}
      />
    </div>
  );
};
