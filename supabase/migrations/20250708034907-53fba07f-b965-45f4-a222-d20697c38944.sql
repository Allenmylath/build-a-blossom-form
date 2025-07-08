
-- Add unique constraint on chat_transcripts table for session_id column
-- This prevents duplicate transcript entries which could cause data inconsistency issues
ALTER TABLE public.chat_transcripts 
ADD CONSTRAINT chat_transcripts_session_id_unique UNIQUE (session_id);
