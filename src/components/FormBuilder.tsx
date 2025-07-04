import { useState } from 'react';
import { FormFieldEditor } from './FormFieldEditor';
import { FormPreview } from './FormPreview';
import { FormTemplates } from './FormTemplates';
import { FormManager } from './FormManager';
import { FormSaveDialog } from './FormSaveDialog';
import { FormExport } from './FormExport';
import { FormField, FormFieldType, FormTemplate, SavedForm, FormSubmissionData } from '@/types/form';
import { Plus, Settings, Eye, Save, FolderOpen, FileText, Download, Upload, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'templates' | 'manage'>('builder');
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
    setActiveTab('builder');
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
    setActiveTab('builder');
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied to your form.`,
    });
  };

  const handleNewForm = () => {
    setFields([]);
    setSelectedFieldId(null);
    setCurrentForm(null);
    setActiveTab('builder');
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

  const fieldTypes: { type: FormFieldType; label: string; icon: string }[] = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'number', label: 'Number', icon: '🔢' },
    { type: 'textarea', label: 'Textarea', icon: '📄' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'date', label: 'Date Picker', icon: '📅' },
    { type: 'file', label: 'File Upload', icon: '📎' },
    { type: 'phone', label: 'Phone Number', icon: '📞' },
    { type: 'url', label: 'Website URL', icon: '🔗' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {currentForm ? `Editing: ${currentForm.name}` : 'Form Builder'}
          </h2>
          <p className="text-sm text-gray-600">
            {currentForm ? 'Make changes to your form' : 'Create beautiful forms with drag-and-drop ease'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleNewForm}>
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={fields.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {currentForm ? 'Update' : 'Save'}
          </Button>
          <Button variant="outline" onClick={() => handleExportImport('export')} disabled={fields.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => handleExportImport('import')}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
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
            My Forms ({savedForms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Builder Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Field Types */}
              <Card className="p-6 bg-white shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-purple-600" />
                  Add Form Fields
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {fieldTypes.map(({ type, label, icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => addField(type)}
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs text-center">{label}</span>
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Field List */}
              <Card className="p-6 bg-white shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Form Fields ({fields.length})</h3>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No fields added yet</p>
                    <p className="text-sm">Add your first field above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedFieldId === field.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{field.label}</span>
                            <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Required</span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {index > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveField(field.id, 'up');
                                }}
                              >
                                ↑
                              </Button>
                            )}
                            {index < fields.length - 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveField(field.id, 'down');
                                }}
                              >
                                ↓
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Field Editor */}
              {selectedField && (
                <FormFieldEditor
                  field={selectedField}
                  onUpdate={(updates) => updateField(selectedField.id, updates)}
                  onDelete={() => deleteField(selectedField.id)}
                />
              )}
            </div>

            {/* Preview Panel */}
            <div>
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
