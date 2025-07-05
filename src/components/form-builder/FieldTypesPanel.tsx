
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { FormFieldType } from '@/types/form';

interface FieldTypesPanelProps {
  onAddField: (type: FormFieldType) => void;
}

export const FieldTypesPanel = ({ onAddField }: FieldTypesPanelProps) => {
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
            onClick={() => onAddField(type)}
            className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-center">{label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
