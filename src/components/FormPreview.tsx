
import { useState } from 'react';
import { FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Eye } from 'lucide-react';
import { FormFieldRenderer } from './form-preview/FormFieldRenderer';
import { FormSubmissionHandler } from './form-preview/FormSubmissionHandler';
import { EmptyFormState } from './form-preview/EmptyFormState';
import { MultiPageForm } from './MultiPageForm';
import { toast } from '@/hooks/use-toast';

interface FormPreviewProps {
  fields: FormField[];
  formId?: string;
  onSubmissionSuccess?: () => void;
}

export const FormPreview = ({ fields, formId, onSubmissionSuccess }: FormPreviewProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if form has page breaks
  const hasPageBreaks = fields.some(field => field.type === 'page-break');

  // If form has page breaks, use MultiPageForm component
  if (hasPageBreaks) {
    return <MultiPageForm fields={fields} formId={formId} onSubmissionSuccess={onSubmissionSuccess} />;
  }

  // Filter out page-break fields for regular form rendering
  const renderableFields = fields.filter(field => field.type !== 'page-break');

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    renderableFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Handle form submission
    if (formId) {
      const submissionHandler = new FormSubmissionHandler();
      await submissionHandler.submitForm(formId, formData, onSubmissionSuccess);
    } else {
      console.log('Form preview submission:', formData);
      toast({
        title: "Form Preview",
        description: "This is a preview. Form data logged to console.",
      });
    }
  };

  if (renderableFields.length === 0) {
    return <EmptyFormState />;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Form Preview</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderableFields.map(field => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            error={errors[field.id]}
            onChange={(value) => updateFormData(field.id, value)}
          />
        ))}
        
        <div className="pt-6 border-t">
          <Button type="submit" className="w-full sm:w-auto">
            <Send className="w-4 h-4 mr-2" />
            Submit Form
          </Button>
        </div>
      </form>
    </Card>
  );
};
