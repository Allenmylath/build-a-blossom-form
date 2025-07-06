
-- Create table for knowledge bases
CREATE TABLE public.knowledge_bases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  token_count INTEGER DEFAULT 0,
  content TEXT, -- Extracted text content from PDF
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for knowledge bases
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge bases" 
  ON public.knowledge_bases 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge bases" 
  ON public.knowledge_bases 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge bases" 
  ON public.knowledge_bases 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge bases" 
  ON public.knowledge_bases 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add knowledge_base_id to forms table
ALTER TABLE public.forms 
ADD COLUMN knowledge_base_id UUID REFERENCES public.knowledge_bases(id);

-- Create storage bucket for knowledge base PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-bases', 'knowledge-bases', false);

-- RLS policies for knowledge base storage
CREATE POLICY "Users can upload their own knowledge base files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-bases' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own knowledge base files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-bases' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own knowledge base files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-bases' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update trigger for knowledge_bases table
CREATE TRIGGER handle_updated_at_knowledge_bases
    BEFORE UPDATE ON public.knowledge_bases
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
