-- Create function to generate chat transcript from messages table
CREATE OR REPLACE FUNCTION public.generate_chat_transcript(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  transcript_result JSONB;
BEGIN
  -- Check if session exists
  IF NOT EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = p_session_id) THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Generate transcript from chat_messages table
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'role', cm.role,
        'content', cm.content,
        'timestamp', cm.created_at,
        'message_index', cm.message_index,
        'metadata', COALESCE(cm.metadata, '{}'::jsonb)
      ) ORDER BY cm.message_index ASC, cm.created_at ASC
    ),
    '[]'::jsonb
  ) INTO transcript_result
  FROM public.chat_messages cm
  WHERE cm.session_id = p_session_id;

  RETURN transcript_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate and update transcript in session
CREATE OR REPLACE FUNCTION public.generate_and_update_chat_transcript(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  transcript_result JSONB;
  message_count INTEGER;
BEGIN
  -- Generate transcript
  SELECT public.generate_chat_transcript(p_session_id) INTO transcript_result;
  
  -- Count messages for the session
  SELECT COUNT(*) INTO message_count
  FROM public.chat_messages
  WHERE session_id = p_session_id;

  -- Update the session with the generated transcript
  UPDATE public.chat_sessions 
  SET 
    full_transcript = transcript_result,
    total_messages = message_count,
    updated_at = now()
  WHERE id = p_session_id;

  RETURN transcript_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get transcript with fallback
CREATE OR REPLACE FUNCTION public.get_chat_transcript(p_session_id UUID, p_use_cache BOOLEAN DEFAULT true)
RETURNS JSONB AS $$
DECLARE
  cached_transcript JSONB;
  cached_count INTEGER;
  actual_count INTEGER;
  transcript_result JSONB;
BEGIN
  -- Check if session exists
  IF NOT EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = p_session_id) THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- If not using cache, generate fresh transcript
  IF NOT p_use_cache THEN
    RETURN public.generate_chat_transcript(p_session_id);
  END IF;

  -- Get cached transcript and message count
  SELECT full_transcript, total_messages
  INTO cached_transcript, cached_count
  FROM public.chat_sessions
  WHERE id = p_session_id;

  -- Get actual message count
  SELECT COUNT(*) INTO actual_count
  FROM public.chat_messages
  WHERE session_id = p_session_id;

  -- If cache is valid (counts match and transcript exists), return cached version
  IF cached_transcript IS NOT NULL 
     AND cached_transcript != '[]'::jsonb 
     AND cached_count = actual_count 
     AND actual_count > 0 THEN
    RETURN cached_transcript;
  END IF;

  -- Cache is invalid or empty, generate fresh transcript and update cache
  RETURN public.generate_and_update_chat_transcript(p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_ordering 
ON public.chat_messages(session_id, message_index, created_at);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_chat_transcript(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_and_update_chat_transcript(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_transcript(UUID, BOOLEAN) TO authenticated, anon;