
import { FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Settings, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
}

export const FormFieldEditor = ({ field, onUpdate, onDelete }: FormFieldEditorProps) => {
  const [options, setOptions] = useState(field.options?.join('\n') || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (updates: Partial<FormField>): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    // Validate label
    if (updates.label !== undefined && (!updates.label || updates.label.trim().length === 0)) {
      newErrors.label = 'Field label is required';
    }
    
    // Validate options for select/radio fields
    if ((field.type === 'select' || field.type === 'radio') && updates.options !== undefined) {
      if (!updates.options || updates.options.length === 0) {
        newErrors.options = 'At least one option is required for this field type';
      } else if (updates.options.some(opt => !opt || opt.trim().length === 0)) {
        newErrors.options = 'All options must have a value';
      }
    }
    
    // Validate validation rules
    if (updates.validation && (field.type === 'text' || field.type === 'number')) {
      const { min, max } = updates.validation;
      if (min !== undefined && max !== undefined && min > max) {
        newErrors.validation = 'Minimum value cannot be greater than maximum value';
      }
      if (min !== undefined && min < 0) {
        newErrors.validation = 'Minimum value cannot be negative';
      }
    }
    
    return newErrors;
  };

  const handleUpdate = (updates: Partial<FormField>) => {
    try {
      const validationErrors = validateField(updates);
      setErrors(validationErrors);
      
      if (Object.keys(validationErrors).length === 0) {
        console.log('Updating field with valid data:', updates);
        onUpdate(updates);
        
        toast({
          title: "Field Updated",
          description: "Field settings have been saved successfully.",
        });
      } else {
        console.log('Field validation failed:', validationErrors);
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted errors before saving.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update field. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOptionsChange = (value: string) => {
    try {
      setOptions(value);
      const optionsArray = value.split('\n')
        .map(opt => opt.trim())
        .filter(opt => opt !== '');
      
      console.log('Updating options:', optionsArray);
      handleUpdate({ options: optionsArray });
    } catch (error) {
      console.error('Error updating options:', error);
      setErrors(prev => ({ ...prev, options: 'Failed to update options' }));
    }
  };

  const handleDelete = () => {
    try {
      console.log('Deleting field:', field.id);
      onDelete();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete field. Please try again.",
        variant: "destructive",
      });
    }
  };

  const showOptionsEditor = field.type === 'select' || field.type === 'radio';
  const showValidationEditor = field.type === 'text' || field.type === 'number';

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
          onClick={handleDelete}
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
            onChange={(e) => handleUpdate({ label: e.target.value })}
            placeholder="Enter field label"
            className={errors.label ? 'border-red-500' : ''}
          />
          {errors.label && (
            <div className="flex items-center mt-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.label}
            </div>
          )}
        </div>

        {field.type !== 'page-break' && (
          <div>
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              value={field.placeholder || ''}
              onChange={(e) => handleUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={field.required}
            onCheckedChange={(checked) => handleUpdate({ required: checked })}
          />
          <Label htmlFor="required">Required field</Label>
        </div>

        {showOptionsEditor && (
          <div>
            <Label htmlFor="options">Options (one per line)</Label>
            <Textarea
              id="options"
              value={options}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
              className={errors.options ? 'border-red-500' : ''}
            />
            {errors.options && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.options}
              </div>
            )}
          </div>
        )}

        {showValidationEditor && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Min Length/Value</Label>
              <Input
                id="min"
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => handleUpdate({
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
                onChange={(e) => handleUpdate({
                  validation: {
                    ...field.validation,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                placeholder="Max"
              />
            </div>
            {errors.validation && (
              <div className="col-span-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.validation}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
