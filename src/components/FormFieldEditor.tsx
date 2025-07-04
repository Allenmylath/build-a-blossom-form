
import { FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Settings } from 'lucide-react';
import { useState } from 'react';

interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
}

export const FormFieldEditor = ({ field, onUpdate, onDelete }: FormFieldEditorProps) => {
  const [options, setOptions] = useState(field.options?.join('\n') || '');

  const handleOptionsChange = (value: string) => {
    setOptions(value);
    const optionsArray = value.split('\n').filter(opt => opt.trim() !== '');
    onUpdate({ options: optionsArray });
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Settings className="w-5 h-5 mr-2 text-purple-600" />
          Field Settings
        </h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="label">Field Label</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Enter field label"
          />
        </div>

        <div>
          <Label htmlFor="placeholder">Placeholder Text</Label>
          <Input
            id="placeholder"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label htmlFor="required">Required field</Label>
        </div>

        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <Label htmlFor="options">Options (one per line)</Label>
            <Textarea
              id="options"
              value={options}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
          </div>
        )}

        {(field.type === 'text' || field.type === 'number') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Min Length/Value</Label>
              <Input
                id="min"
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...field.validation,
                    min: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                placeholder="Min"
              />
            </div>
            <div>
              <Label htmlFor="max">Max Length/Value</Label>
              <Input
                id="max"
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...field.validation,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
