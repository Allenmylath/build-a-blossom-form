
-- Create forms table to store user-created forms
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_submissions table to store form responses
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET
);

-- Create chats table to store chat conversations
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table to store individual chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms table
CREATE POLICY "Users can view their own forms" 
  ON public.forms 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public forms" 
  ON public.forms 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can create their own forms" 
  ON public.forms 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" 
  ON public.forms 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" 
  ON public.forms 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for form_submissions table
CREATE POLICY "Form owners can view submissions" 
  ON public.form_submissions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_submissions.form_id 
    AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can submit to public forms" 
  ON public.form_submissions 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_submissions.form_id 
    AND forms.is_public = true
  ));

CREATE POLICY "Authenticated users can submit to any form" 
  ON public.form_submissions 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for chats table
CREATE POLICY "Users can view their own chats" 
  ON public.chats 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" 
  ON public.chats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
  ON public.chats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
  ON public.chats 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages from their chats" 
  ON public.chat_messages 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = chat_messages.chat_id 
    AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their chats" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = chat_messages.chat_id 
    AND chats.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_forms_is_public ON public.forms(is_public);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_form_id ON public.chats(form_id);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER handle_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
