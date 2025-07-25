export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      calendar_integrations: {
        Row: {
          access_token_encrypted: string | null
          calendar_email: string | null
          calendar_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          provider: string
          refresh_token_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendly_integrations: {
        Row: {
          access_token_encrypted: string
          calendly_email: string
          calendly_user_uri: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          organization_uri: string | null
          refresh_token_encrypted: string | null
          scheduling_urls: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          calendly_email: string
          calendly_user_uri: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_uri?: string | null
          refresh_token_encrypted?: string | null
          scheduling_urls?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          calendly_email?: string
          calendly_user_uri?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_uri?: string | null
          refresh_token_encrypted?: string | null
          scheduling_urls?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_api_configs: {
        Row: {
          api_key_encrypted: string | null
          api_provider: string
          created_at: string
          form_id: string
          id: string
          is_active: boolean
          max_tokens: number | null
          model_name: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_provider?: string
          created_at?: string
          form_id: string
          id?: string
          is_active?: boolean
          max_tokens?: number | null
          model_name?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_provider?: string
          created_at?: string
          form_id?: string
          id?: string
          is_active?: boolean
          max_tokens?: number | null
          model_name?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_api_configs_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_api_configs_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "unified_form_analytics"
            referencedColumns: ["form_id"]
          },
        ]
      }
      chat_flows: {
        Row: {
          created_at: string
          description: string | null
          flow_data: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flow_data?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flow_data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          api_response_time: number | null
          chat_id: string | null
          content: string
          created_at: string
          id: string
          is_streamed: boolean | null
          message_index: number
          message_type: string
          metadata: Json | null
          role: string
          session_id: string | null
          token_usage: Json | null
        }
        Insert: {
          api_response_time?: number | null
          chat_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_streamed?: boolean | null
          message_index?: number
          message_type?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          token_usage?: Json | null
        }
        Update: {
          api_response_time?: number | null
          chat_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_streamed?: boolean | null
          message_index?: number
          message_type?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          token_usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          conversation_context: Json | null
          created_at: string
          form_field_id: string
          form_id: string
          full_transcript: Json | null
          id: string
          is_active: boolean
          last_activity: string
          session_key: string
          submission_id: string | null
          total_messages: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation_context?: Json | null
          created_at?: string
          form_field_id: string
          form_id: string
          full_transcript?: Json | null
          id?: string
          is_active?: boolean
          last_activity?: string
          session_key: string
          submission_id?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation_context?: Json | null
          created_at?: string
          form_field_id?: string
          form_id?: string
          full_transcript?: Json | null
          id?: string
          is_active?: boolean
          last_activity?: string
          session_key?: string
          submission_id?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "unified_form_analytics"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "chat_sessions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_transcripts: {
        Row: {
          conversation_summary: string | null
          created_at: string
          export_format: string | null
          id: string
          message_count: number
          session_id: string
          transcript_data: Json
          updated_at: string
        }
        Insert: {
          conversation_summary?: string | null
          created_at?: string
          export_format?: string | null
          id?: string
          message_count?: number
          session_id: string
          transcript_data?: Json
          updated_at?: string
        }
        Update: {
          conversation_summary?: string | null
          created_at?: string
          export_format?: string | null
          id?: string
          message_count?: number
          session_id?: string
          transcript_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          form_id: string | null
          id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          form_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "unified_form_analytics"
            referencedColumns: ["form_id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          chat_session_references: Json | null
          completion_time_seconds: number | null
          data: Json
          form_id: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          pages_visited: Json | null
          submission_type: string
          submitted_at: string
          total_interactions: number | null
          user_id: string | null
        }
        Insert: {
          chat_session_references?: Json | null
          completion_time_seconds?: number | null
          data?: Json
          form_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          pages_visited?: Json | null
          submission_type?: string
          submitted_at?: string
          total_interactions?: number | null
          user_id?: string | null
        }
        Update: {
          chat_session_references?: Json | null
          completion_time_seconds?: number | null
          data?: Json
          form_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          pages_visited?: Json | null
          submission_type?: string
          submitted_at?: string
          total_interactions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "unified_form_analytics"
            referencedColumns: ["form_id"]
          },
        ]
      }
      forms: {
        Row: {
          chat_flow_id: string | null
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_public: boolean
          knowledge_base_id: string | null
          name: string
          share_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_flow_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_public?: boolean
          knowledge_base_id?: string | null
          name: string
          share_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_flow_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_public?: boolean
          knowledge_base_id?: string | null
          name?: string
          share_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_chat_flow_id_fkey"
            columns: ["chat_flow_id"]
            isOneToOne: false
            referencedRelation: "chat_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          id: string
          name: string
          token_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          id?: string
          name: string
          token_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          id?: string
          name?: string
          token_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      unified_form_analytics: {
        Row: {
          avg_completion_time: number | null
          avg_interactions: number | null
          chat_submissions: number | null
          form_classification: string | null
          form_id: string | null
          form_name: string | null
          hybrid_submissions: number | null
          last_submission: string | null
          submissions_month: number | null
          submissions_today: number | null
          submissions_week: number | null
          total_chat_sessions: number | null
          total_submissions: number | null
          traditional_submissions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_inactive_chat_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_hybrid_submission: {
        Args: {
          p_form_id: string
          p_user_id: string
          p_traditional_data: Json
          p_chat_sessions?: Json
          p_completion_time?: number
          p_pages_visited?: Json
        }
        Returns: string
      }
      create_unified_chat_submission: {
        Args: { p_session_id: string; p_summary_data?: Json }
        Returns: string
      }
      generate_and_update_chat_transcript: {
        Args: { p_session_id: string }
        Returns: Json
      }
      generate_chat_transcript: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_chat_transcript: {
        Args: { p_session_id: string; p_use_cache?: boolean }
        Returns: Json
      }
      migrate_existing_chat_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      plan_type: "hobby" | "startup" | "enterprise"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_type: ["hobby", "startup", "enterprise"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
    },
  },
} as const
