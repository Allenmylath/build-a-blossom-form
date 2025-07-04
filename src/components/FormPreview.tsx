
import { FormField, FormSubmission } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface FormPreviewProps {
  fields: FormField[];
}

export const FormPreview = ({ fields }: FormPreviewProps) => {
  const [formData, setFormData] = useState<FormSubmission>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      
      if (field.validation) {
        const value = formData[field.id] as string;
        if (value) {
          if (field.validation.min && value.length < field.validation.min) {
            newErrors[field.id] = `${field.label} must be at least ${field.validation.min} characters`;
          }
          if (field.validation.max && value.length > field.validation.max) {
            newErrors[field.id] = `${field.label} must be no more than ${field.validation.max} characters`;
          }
        }
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      toast({
        title: "Form Submitted Successfully!",
        description: "Check the console to see the submitted data.",
      });
    }
  };

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const errorMessage = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'url':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === 'phone' ? 'tel' : field.type}
              placeholder={field.placeholder}
              value={formData[field.id] as string || ''}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] as string || ''}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              rows={3}
            />
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => updateFormData(field.id, value)}>
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
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );
      
      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              onValueChange={(value) => updateFormData(field.id, value)}
              className={hasError ? 'border border-red-500 rounded p-2' : ''}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={formData[field.id] as boolean || false}
                onCheckedChange={(checked) => updateFormData(field.id, checked)}
              />
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={formData[field.id] as string || ''}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              onChange={(e) => updateFormData(field.id, e.target.files?.[0]?.name || '')}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-white shadow-lg sticky top-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        Form Preview
      </h3>
      
      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No fields to preview</p>
          <p className="text-sm">Add some fields to see your form here</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(renderField)}
          
          <Button type="submit" className="w-full flex items-center justify-center">
            <Send className="w-4 h-4 mr-2" />
            Submit Form
          </Button>
        </form>
      )}
    </Card>
  );
};
