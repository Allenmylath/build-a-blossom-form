-- Create chat_flows table for storing chat conversation flows
CREATE TABLE public.chat_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  flow_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_flows ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (always private)
CREATE POLICY "Users can view their own chat flows" 
ON public.chat_flows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat flows" 
ON public.chat_flows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat flows" 
ON public.chat_flows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat flows" 
ON public.chat_flows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add chat_flow_id to forms table for linking
ALTER TABLE public.forms 
ADD COLUMN chat_flow_id UUID REFERENCES public.chat_flows(id) ON DELETE SET NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_flows_updated_at
BEFORE UPDATE ON public.chat_flows
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();