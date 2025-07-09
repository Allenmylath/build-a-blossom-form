
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, FileText } from 'lucide-react';
import { FormActions } from './FormActions';
import { FieldTypesPanel } from './FieldTypesPanel';
import { FieldList } from './FieldList';
import { FormFieldEditor } from '../FormFieldEditor';
import { FormPreview } from '../FormPreview';
import { FormTemplates } from '../FormTemplates';
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
      <TabsList className="grid w-full grid-cols-3">
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
      </TabsList>

      <TabsContent value="builder" className="mt-0">
        <FormActions
          onSave={onSave}
          onNew={onNew}
          onExportImport={onExportImport}
          hasFields={fields.length > 0}
        />
        
        <div className="grid lg:grid-cols-2 gap-2">
          {/* Left column: Field Types Panel */}
          <div className="space-y-4">
            <FieldTypesPanel onAddField={onAddField} />
          </div>

          {/* Right column: Field Editor on top, Form Fields List below */}
          <div className="space-y-4">
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
            
            <FieldList
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
              onMoveField={onMoveField}
              onDeleteField={onDeleteField}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        <div className="max-w-2xl mx-auto">
          <FormPreview fields={fields} />
        </div>
      </TabsContent>

      <TabsContent value="templates" className="mt-0">
        <FormTemplates onSelectTemplate={onSelectTemplate} />
      </TabsContent>

    </Tabs>
  );
};
