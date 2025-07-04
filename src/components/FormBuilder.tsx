
import { useState } from 'react';
import { FormFieldEditor } from './FormFieldEditor';
import { FormPreview } from './FormPreview';
import { FormField, FormFieldType } from '@/types/form';
import { Plus, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

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

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const fieldTypes: { type: FormFieldType; label: string; icon: string }[] = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'number', label: 'Number', icon: '🔢' },
    { type: 'textarea', label: 'Textarea', icon: '📄' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden mb-4">
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={activeTab === 'builder' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('builder')}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Builder
          </Button>
          <Button
            variant={activeTab === 'preview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('preview')}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Builder Panel */}
        <div className={`lg:col-span-2 space-y-6 ${activeTab === 'preview' ? 'hidden md:block' : ''}`}>
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
            <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
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
        <div className={`${activeTab === 'builder' ? 'hidden md:block' : ''}`}>
          <FormPreview fields={fields} />
        </div>
      </div>
    </div>
  );
};
