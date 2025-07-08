
-- Migration: Enhanced chat system for real-time Gemini API integration and transcript storage

-- Create chat_sessions table for managing conversation contexts
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  form_field_id TEXT NOT NULL, -- References the chat field ID within the form
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL, -- Unique identifier for anonymous users
  conversation_context JSONB DEFAULT '[]'::jsonb, -- For Gemini API context
  full_transcript JSONB DEFAULT '[]'::jsonb, -- Complete conversation as JSON
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_messages INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance existing chat_messages table for real-time storage
ALTER TABLE public.chat_messages 
ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'error')),
ADD COLUMN api_response_time INTEGER, -- Response time in milliseconds
ADD COLUMN token_usage JSONB, -- Store token usage info from Gemini
ADD COLUMN message_index INTEGER NOT NULL DEFAULT 0, -- Order in conversation
ADD COLUMN is_streamed BOOLEAN DEFAULT false; -- For future streaming support

-- Create chat_transcripts table for storing complete conversations
CREATE TABLE public.chat_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  transcript_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  conversation_summary TEXT, -- AI-generated summary for long conversations
  export_format TEXT DEFAULT 'json' CHECK (export_format IN ('json', 'markdown', 'text')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add API configuration table for Gemini settings
CREATE TABLE public.chat_api_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  api_provider TEXT NOT NULL DEFAULT 'gemini' CHECK (api_provider IN ('gemini', 'openai', 'anthropic')),
  api_key_encrypted TEXT, -- Encrypted API key storage
  model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  system_prompt TEXT,
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, form_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_api_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND session_key IS NOT NULL) -- Allow anonymous sessions
  );

CREATE POLICY "Users can create chat sessions" 
  ON public.chat_sessions 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND session_key IS NOT NULL) -- Allow anonymous sessions
  );

CREATE POLICY "Users can update their own chat sessions" 
  ON public.chat_sessions 
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND session_key IS NOT NULL)
  );

CREATE POLICY "Form owners can view all sessions for their forms" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = chat_sessions.form_id 
    AND forms.user_id = auth.uid()
  ));

-- RLS Policies for chat_transcripts
CREATE POLICY "Users can view their own chat transcripts" 
  ON public.chat_transcripts 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE chat_sessions.id = chat_transcripts.session_id 
    AND (chat_sessions.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = chat_sessions.form_id 
      AND forms.user_id = auth.uid()
    ))
  ));

CREATE POLICY "System can create chat transcripts" 
  ON public.chat_transcripts 
  FOR INSERT 
  WITH CHECK (true); -- Allow system to create transcripts

CREATE POLICY "Users can update their own chat transcripts" 
  ON public.chat_transcripts 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE chat_sessions.id = chat_transcripts.session_id 
    AND (chat_sessions.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = chat_sessions.form_id 
      AND forms.user_id = auth.uid()
    ))
  ));

-- RLS Policies for chat_api_configs
CREATE POLICY "Users can view their own API configs" 
  ON public.chat_api_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API configs" 
  ON public.chat_api_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API configs" 
  ON public.chat_api_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API configs" 
  ON public.chat_api_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Update existing chat_messages RLS to include sessions
DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.chat_messages;

CREATE POLICY "Users can view messages from their chat sessions" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    (chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.user_id = auth.uid()
    )) OR
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND (chat_sessions.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.forms 
        WHERE forms.id = chat_sessions.form_id 
        AND forms.user_id = auth.uid()
      ))
    ))
  );

CREATE POLICY "Users can create messages in their chat sessions" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    (chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.user_id = auth.uid()
    )) OR
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND (chat_sessions.user_id = auth.uid() OR chat_sessions.session_key IS NOT NULL)
    ))
  );

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_form_id ON public.chat_sessions(form_id);
CREATE INDEX idx_chat_sessions_form_field_id ON public.chat_sessions(form_field_id);
CREATE INDEX idx_chat_sessions_session_key ON public.chat_sessions(session_key);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_is_active ON public.chat_sessions(is_active);
CREATE INDEX idx_chat_sessions_last_activity ON public.chat_sessions(last_activity);

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_message_index ON public.chat_messages(session_id, message_index);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

CREATE INDEX idx_chat_transcripts_session_id ON public.chat_transcripts(session_id);
CREATE INDEX idx_chat_transcripts_message_count ON public.chat_transcripts(message_count);

CREATE INDEX idx_chat_api_configs_user_form ON public.chat_api_configs(user_id, form_id);

-- Create updated_at triggers for new tables
CREATE TRIGGER handle_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_chat_transcripts_updated_at
  BEFORE UPDATE ON public.chat_transcripts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_chat_api_configs_updated_at
  BEFORE UPDATE ON public.chat_api_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically update session activity and transcript
CREATE OR REPLACE FUNCTION public.update_chat_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session activity and message count
  UPDATE public.chat_sessions 
  SET 
    last_activity = now(),
    total_messages = total_messages + 1,
    full_transcript = full_transcript || jsonb_build_object(
      'role', NEW.role,
      'content', NEW.content,
      'timestamp', NEW.created_at,
      'message_index', NEW.message_index,
      'metadata', COALESCE(NEW.metadata, '{}'::jsonb)
    )
  WHERE id = NEW.session_id;
  
  -- Update or create transcript record
  INSERT INTO public.chat_transcripts (session_id, transcript_data, message_count)
  VALUES (
    NEW.session_id,
    jsonb_build_array(jsonb_build_object(
      'role', NEW.role,
      'content', NEW.content,
      'timestamp', NEW.created_at,
      'message_index', NEW.message_index,
      'metadata', COALESCE(NEW.metadata, '{}'::jsonb)
    )),
    1
  )
  ON CONFLICT (session_id) DO UPDATE SET
    transcript_data = chat_transcripts.transcript_data || jsonb_build_object(
      'role', NEW.role,
      'content', NEW.content,
      'timestamp', NEW.created_at,
      'message_index', NEW.message_index,
      'metadata', COALESCE(NEW.metadata, '{}'::jsonb)
    ),
    message_count = chat_transcripts.message_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update transcripts when messages are added
CREATE TRIGGER update_chat_session_on_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW 
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.update_chat_session_activity();

-- Function to clean up inactive sessions (can be called by cron job)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_chat_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.chat_sessions 
  SET is_active = false 
  WHERE is_active = true 
    AND last_activity < now() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;
