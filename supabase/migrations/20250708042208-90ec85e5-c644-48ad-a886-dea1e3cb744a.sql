
-- Fix RLS policies for chat_sessions to properly allow anonymous users on public forms
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;

-- Create new policies that properly handle anonymous users with public forms
CREATE POLICY "Users can create chat sessions for public forms" 
  ON public.chat_sessions 
  FOR INSERT 
  WITH CHECK (
    -- Authenticated users can create sessions for any form they own
    (auth.uid() = user_id) OR 
    -- Anonymous users can create sessions for public forms
    (user_id IS NULL AND session_key IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = chat_sessions.form_id 
      AND forms.is_public = true
    ))
  );

CREATE POLICY "Users can view chat sessions" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (
    -- Users can view their own sessions
    (auth.uid() = user_id) OR 
    -- Anonymous users can view sessions they created (by session_key)
    (user_id IS NULL AND session_key IS NOT NULL) OR
    -- Form owners can view all sessions for their forms
    (EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = chat_sessions.form_id 
      AND forms.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update chat sessions" 
  ON public.chat_sessions 
  FOR UPDATE 
  USING (
    -- Users can update their own sessions
    (auth.uid() = user_id) OR 
    -- Anonymous users can update sessions they created (by session_key)
    (user_id IS NULL AND session_key IS NOT NULL) OR
    -- Form owners can update sessions for their forms
    (EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = chat_sessions.form_id 
      AND forms.user_id = auth.uid()
    ))
  );

-- Fix RLS policies for chat_messages to allow anonymous users
DROP POLICY IF EXISTS "Users can create messages in their chat sessions" ON public.chat_messages;

CREATE POLICY "Users can create messages in chat sessions" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    -- For legacy chat_id based messages
    (chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.user_id = auth.uid()
    )) OR
    -- For session-based messages
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND (
        -- User owns the session
        chat_sessions.user_id = auth.uid() OR 
        -- Anonymous session with valid session_key for public form
        (chat_sessions.user_id IS NULL AND chat_sessions.session_key IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.forms 
          WHERE forms.id = chat_sessions.form_id 
          AND forms.is_public = true
        ))
      )
    ))
  );
