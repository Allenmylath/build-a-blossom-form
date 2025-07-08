-- Make chat_id nullable
ALTER TABLE public.chat_messages 
ALTER COLUMN chat_id DROP NOT NULL;

-- Drop and recreate the foreign key constraint
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;

-- Ensure either chat_id or session_id is present
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_chat_or_session_check 
CHECK (chat_id IS NOT NULL OR session_id IS NOT NULL);