
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, FolderOpen, FileText } from 'lucide-react';
import { FormActions } from './FormActions';
import { BuilderPanel } from './BuilderPanel';
import { FormFieldEditor } from '../FormFieldEditor';
import { FormPreview } from '../FormPreview';
import { FormTemplates } from '../FormTemplates';
import { FormManager } from '../FormManager';
import { FormField, SavedForm, FormTemplate } from '@/types/form';

interface FormBuilderTabsProps {
  fields: FormField[];
  selectedFieldId: string | null;
  currentForm: SavedForm | null;
  savedForms: SavedForm[];
  onAddField: (type: any) => void;
  onSelectField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onSave: () => void;
  onNew: () => void;
  onExportImport: (action: 'export' | 'import') => void;
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
}

export const FormBuilderTabs = ({
  fields,
  selectedFieldId,
  currentForm,
  savedForms,
  onAddField,
  onSelectField,
  onMoveField,
  onUpdateField,
  onDeleteField,
  onSave,
  onNew,
  onExportImport,
  onLoadForm,
  onDeleteForm,
  onDuplicateForm,
  onShareForm,
  onSelectTemplate,
  onUpdateForm,
}: FormBuilderTabsProps) => {
  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
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
      </TabsList>

      <TabsContent value="builder">
        <FormActions
          onSave={onSave}
          onNew={onNew}
          onExportImport={onExportImport}
          hasFields={fields.length > 0}
        />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormPreview fields={fields} />
            <BuilderPanel
              fields={fields}
              selectedFieldId={selectedFieldId}
              onAddField={onAddField}
              onSelectField={onSelectField}
              onMoveField={onMoveField}
              onDeleteField={onDeleteField}
            />
          </div>

          <div className="space-y-6">
            {selectedField ? (
              <FormFieldEditor
                field={selectedField}
                onUpdate={(updates) => onUpdateField(selectedField.id, updates)}
                onDelete={() => onDeleteField(selectedField.id)}
              />
            ) : (
              <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p>Select a field to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview">
        <div className="max-w-2xl mx-auto">
          <FormPreview fields={fields} />
        </div>
      </TabsContent>

      <TabsContent value="templates">
        <FormTemplates onSelectTemplate={onSelectTemplate} />
      </TabsContent>

      <TabsContent value="manage">
        <FormManager
          savedForms={savedForms}
          onLoadForm={onLoadForm}
          onDeleteForm={onDeleteForm}
          onDuplicateForm={onDuplicateForm}
          onShareForm={onShareForm}
          onUpdateForm={onUpdateForm}
        />
      </TabsContent>

    </Tabs>
  );
};
