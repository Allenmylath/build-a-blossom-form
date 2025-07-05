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

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [currentForm, setCurrentForm] = useState<SavedForm | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

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

  const handleSaveForm = (formData: { name: string; description: string; isPublic: boolean }) => {
    const now = new Date();
    
    if (currentForm) {
      // Update existing form
      const updatedForm: SavedForm = {
        ...currentForm,
        ...formData,
        fields,
        updatedAt: now,
      };
      setSavedForms(forms => forms.map(f => f.id === currentForm.id ? updatedForm : f));
      setCurrentForm(updatedForm);
      toast({
        title: "Form Updated",
        description: `"${formData.name}" has been updated successfully.`,
      });
    } else {
      // Create new form
      const newForm: SavedForm = {
        id: `form_${Date.now()}`,
        ...formData,
        fields,
        createdAt: now,
        updatedAt: now,
        submissions: [],
        shareUrl: `${window.location.origin}/form/form_${Date.now()}`,
      };
      setSavedForms(forms => [...forms, newForm]);
      setCurrentForm(newForm);
      toast({
        title: "Form Saved",
        description: `"${formData.name}" has been saved successfully.`,
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

  const handleDeleteForm = (formId: string) => {
    setSavedForms(forms => forms.filter(f => f.id !== formId));
    if (currentForm?.id === formId) {
      setCurrentForm(null);
    }
  };

  const handleDuplicateForm = (form: SavedForm) => {
    const now = new Date();
    const duplicatedForm: SavedForm = {
      ...form,
      id: `form_${Date.now()}`,
      name: `${form.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      submissions: [],
      shareUrl: `${window.location.origin}/form/form_${Date.now()}`,
    };
    setSavedForms(forms => [...forms, duplicatedForm]);
  };

  const handleShareForm = (form: SavedForm) => {
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
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
      // Import functionality would go here
      toast({
        title: "Import Feature",
        description: "Import functionality coming soon!",
      });
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="space-y-6">
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

            {/* Field Editor and Preview Panel */}
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

      {/* Dialogs */}
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
