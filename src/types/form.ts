
export type FormFieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'phone' | 'url' | 'chat' | 'page-break';

export type SubmissionType = 'traditional' | 'chat' | 'hybrid';

export interface ChatFieldResponse {
  type: 'chat';
  sessionId: string;
  messageCount: number;
  conversationDuration: number;
  summaryResponse: string;
  keyMessages: Array<{
    role: string;
    content: string;
    timestamp: string;
    importance: string;
  }>;
  transcriptReference: string;
}

export interface UnifiedSubmissionMetadata {
  chatSessionsCount?: number;
  formType?: string;
  totalInteractions?: number;
  conversationDuration?: number;
  fieldId?: string;
  traditionalFieldsCount?: number;
  chatFieldsCount?: number;
}

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
  knowledgeBaseId?: string;
}

export interface FormSubmissionData {
  id: string;
  formId: string;
  data: FormSubmission & {
    _chatResponses?: { [fieldId: string]: ChatFieldResponse };
  };
  submittedAt: Date;
  ipAddress?: string;
  userId?: string;
  submissionType: SubmissionType;
  completionTimeSeconds?: number;
  totalInteractions: number;
  chatSessionReferences: string[];
  metadata: UnifiedSubmissionMetadata;
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
