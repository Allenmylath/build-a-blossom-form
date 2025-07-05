
import { FormField, FormSubmission } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface FormFieldRendererProps {
  field: FormField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

export const FormFieldRenderer = ({ field, value, error, onChange }: FormFieldRendererProps) => {
  const hasError = !!error;

  const renderLabel = () => (
    <Label htmlFor={field.id}>
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  const renderError = () => (
    hasError && <p className="text-red-500 text-sm">{error}</p>
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'url':
    case 'phone':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            id={field.id}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
          {renderError()}
        </div>
      );
    
    case 'textarea':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            rows={3}
          />
          {renderError()}
        </div>
      );
    
    case 'select':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Select onValueChange={onChange}>
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderError()}
        </div>
      );
    
    case 'radio':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <RadioGroup
            onValueChange={onChange}
            className={hasError ? 'border border-red-500 rounded p-2' : ''}
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {renderError()}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value as boolean || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
          {renderError()}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            id={field.id}
            type="date"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
          {renderError()}
        </div>
      );

    case 'file':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            id={field.id}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0]?.name || '')}
            className={hasError ? 'border-red-500' : ''}
          />
          {renderError()}
        </div>
      );
    
    default:
      return null;
  }
};
