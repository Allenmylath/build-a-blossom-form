
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
  knowledgeBaseId?: string;
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
// Add these new interfaces to src/types/form.ts

export interface UnifiedSubmissionData {
  id: string;
  form_id: string;
  submitted_at: string;
  ip_address?: string;
  user_id?: string;
  
  // Unified data structure
  field_responses: {
    // Traditional field responses
    traditional_fields: Record<string, any>;
    
    // Chat field responses with context
    chat_fields: Record<string, ChatFieldResponse>;
  };
  
  // Metadata for analytics
  submission_metadata: {
    completion_time_seconds: number;
    pages_visited: string[];
    chat_sessions_count: number;
    total_interactions: number;
    form_type: 'traditional' | 'chat' | 'hybrid';
  };
}

export interface ChatFieldResponse {
  field_id: string;
  session_id: string;
  summary_response?: string; // AI-extracted key response
  message_count: number;
  conversation_duration_seconds: number;
  key_messages: Array<{
    role: 'user' | 'bot';
    content: string;
    timestamp: string;
    importance_score?: number; // For analytics
  }>;
  full_transcript_reference: string; // Link to detailed chat_sessions record
}

// You might also want to update the existing FormSubmissionData interface
// to extend or work with the new unified structure
export interface EnhancedFormSubmissionData extends UnifiedSubmissionData {
  // Add any additional properties specific to your form system
}
