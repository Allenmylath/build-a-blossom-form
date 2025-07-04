import { FormTemplate } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus } from 'lucide-react';

interface FormTemplatesProps {
  onSelectTemplate: (template: FormTemplate) => void;
}

const TEMPLATES: FormTemplate[] = [
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Basic contact form with name, email, and message',
    category: 'Business',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
      { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { id: 'subject', type: 'text', label: 'Subject', required: true, placeholder: 'What is this about?' },
      { id: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'Your message here...' }
    ]
  },
  {
    id: 'survey-form',
    name: 'Customer Survey',
    description: 'Collect customer feedback and satisfaction ratings',
    category: 'Survey',
    fields: [
      { id: 'rating', type: 'radio', label: 'Overall Satisfaction', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { id: 'recommend', type: 'radio', label: 'Would you recommend us?', required: true, options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'] },
      { id: 'feedback', type: 'textarea', label: 'Additional Feedback', required: false, placeholder: 'Any additional comments?' }
    ]
  },
  {
    id: 'registration-form',
    name: 'Event Registration',
    description: 'Event registration with personal details and preferences',
    category: 'Events',
    fields: [
      { id: 'firstName', type: 'text', label: 'First Name', required: true, placeholder: 'First name' },
      { id: 'lastName', type: 'text', label: 'Last Name', required: true, placeholder: 'Last name' },
      { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Email address' },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true, placeholder: 'Phone number' },
      { id: 'dietary', type: 'select', label: 'Dietary Restrictions', required: false, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Other'] },
      { id: 'newsletter', type: 'checkbox', label: 'Subscribe to newsletter', required: false }
    ]
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Comprehensive job application form',
    category: 'HR',
    fields: [
      { id: 'fullName', type: 'text', label: 'Full Name', required: true, placeholder: 'Your full name' },
      { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Email address' },
      { id: 'phone', type: 'phone', label: 'Phone', required: true, placeholder: 'Phone number' },
      { id: 'position', type: 'select', label: 'Position Applied For', required: true, options: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Designer', 'Product Manager'] },
      { id: 'experience', type: 'number', label: 'Years of Experience', required: true, placeholder: 'Years' },
      { id: 'cover', type: 'textarea', label: 'Cover Letter', required: true, placeholder: 'Tell us why you want to work with us...' },
      { id: 'resume', type: 'file', label: 'Upload Resume', required: true }
    ]
  }
];

export const FormTemplates = ({ onSelectTemplate }: FormTemplatesProps) => {
  const categories = [...new Set(TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
          <FileText className="w-6 h-6 mr-2 text-purple-600" />
          Form Templates
        </h2>
        <p className="text-gray-600">Start with a pre-built template and customize it to your needs</p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {TEMPLATES.filter(t => t.category === category).map(template => (
              <Card key={template.id} className="p-4 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {template.fields.length} fields
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
