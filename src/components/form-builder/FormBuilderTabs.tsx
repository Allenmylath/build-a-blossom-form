
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, FolderOpen, FileText, MessageCircle } from 'lucide-react';
import { FormActions } from './FormActions';
import { BuilderPanel } from './BuilderPanel';
import { FormFieldEditor } from '../FormFieldEditor';
import { FormPreview } from '../FormPreview';
import { FormTemplates } from '../FormTemplates';
import { FormManager } from '../FormManager';
import { ConversationalForm } from '../ConversationalForm';
import { FormField, SavedForm, FormTemplate } from '@/types/form';

interface FormBuilderTabsProps {
  fields: FormField[];
  selectedFieldId: string | null;
  currentForm: SavedForm | null;
  savedForms: SavedForm[];
  isHobbyPlan: boolean;
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
}

export const FormBuilderTabs = ({
  fields,
  selectedFieldId,
  currentForm,
  savedForms,
  isHobbyPlan,
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
}: FormBuilderTabsProps) => {
  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className={`grid w-full ${isHobbyPlan ? 'grid-cols-4' : 'grid-cols-5'}`}>
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
        {!isHobbyPlan && (
          <TabsTrigger value="chat" className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat Form
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="builder">
        <FormActions
          onSave={onSave}
          onNew={onNew}
          onExportImport={onExportImport}
          hasFields={fields.length > 0}
        />
        
        <div className="grid lg:grid-cols-3 gap-6">
          <BuilderPanel
            fields={fields}
            selectedFieldId={selectedFieldId}
            onAddField={onAddField}
            onSelectField={onSelectField}
            onMoveField={onMoveField}
          />

          <div className="space-y-6">
            {selectedField && (
              <FormFieldEditor
                field={selectedField}
                onUpdate={(updates) => onUpdateField(selectedField.id, updates)}
                onDelete={() => onDeleteField(selectedField.id)}
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
        <FormTemplates onSelectTemplate={onSelectTemplate} />
      </TabsContent>

      <TabsContent value="manage">
        <FormManager
          savedForms={savedForms}
          onLoadForm={onLoadForm}
          onDeleteForm={onDeleteForm}
          onDuplicateForm={onDuplicateForm}
          onShareForm={onShareForm}
        />
      </TabsContent>

      {!isHobbyPlan && (
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
      )}
    </Tabs>
  );
};
