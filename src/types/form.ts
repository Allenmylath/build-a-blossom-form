export type FormFieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'phone' | 'url' | 'chat' | 'page-break';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  // Chat-specific properties
  chatConfig?: {
    botName?: string;
    welcomeMessage?: string;
    apiUrl?: string;
  };
}

export interface FormSubmission {
  [fieldId: string]: string | string[] | boolean;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  thumbnail?: string;
}

export interface SavedForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  submissions: FormSubmissionData[];
  isPublic: boolean;
  shareUrl?: string;
}

export interface FormSubmissionData {
  id: string;
  formId: string;
  data: FormSubmission;
  submittedAt: Date;
  ipAddress?: string;
}

export interface FormAnalytics {
  totalSubmissions: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  averageCompletionTime: number;
  abandonmentRate: number;
  fieldAnalytics: {
    [fieldId: string]: {
      totalResponses: number;
      mostCommonValues: { value: string; count: number }[];
    };
  };
}
