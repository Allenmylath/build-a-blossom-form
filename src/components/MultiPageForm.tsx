
import { useState } from 'react';
import { FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { FormFieldRenderer } from './form-preview/FormFieldRenderer';
import { useFormSubmission } from './form-preview/FormSubmissionHandler';
import { toast } from '@/hooks/use-toast';

interface MultiPageFormProps {
  fields: FormField[];
  formId?: string;
  onSubmissionSuccess?: () => void;
}

export const MultiPageForm = ({ fields, formId, onSubmissionSuccess }: MultiPageFormProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split fields into pages based on page-break fields
  const pages = fields.reduce((acc, field, index) => {
    if (field.type === 'page-break') {
      acc.push([]);
    } else {
      if (acc.length === 0) acc.push([]);
      acc[acc.length - 1].push(field);
    }
    return acc;
  }, [] as FormField[][]);

  // If no page breaks, put all non-page-break fields in one page
  if (pages.length === 0 && fields.length > 0) {
    pages.push(fields.filter(f => f.type !== 'page-break'));
  }

  const totalPages = pages.length;
  const currentPageFields = pages[currentPage] || [];
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateCurrentPage = () => {
    const pageErrors: Record<string, string> = {};
    
    currentPageFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        pageErrors[field.id] = 'This field is required';
      }
    });

    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const { handleSubmit } = useFormSubmission({
    fields: currentPageFields,
    formData,
    setErrors,
    formId,
    onSubmissionSuccess,
    setIsSubmitting
  });

  const onSubmit = (e: React.FormEvent) => {
    if (!validateCurrentPage()) {
      e.preventDefault();
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    handleSubmit(e);
  };

  if (totalPages === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No form fields to display</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* Progress indicator */}
      {totalPages > 1 && (
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Page {currentPage + 1} of {totalPages}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Form content */}
      <form onSubmit={onSubmit} className="p-6">
        <div className="space-y-6">
          {currentPageFields.map(field => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={formData[field.id]}
              error={errors[field.id]}
              onChange={(value) => updateFormData(field.id, value)}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPage === 0}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentPage < totalPages - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex items-center"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
};
