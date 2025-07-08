-- Migration: Unified Data Model for Traditional and Chat Form Submissions
-- Creates a single source of truth for all form responses while maintaining detailed chat transcripts

-- Step 1: Enhance form_submissions table with unified data structure
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'traditional' 
  CHECK (submission_type IN ('traditional', 'chat', 'hybrid')),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS completion_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pages_visited JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS chat_session_references JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Step 2: Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_form_submissions_submission_type ON public.form_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON public.form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_user ON public.form_submissions(form_id, user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON public.form_submissions(submitted_at DESC);

-- Step 3: Add reference from chat_sessions to form_submissions for linking
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.form_submissions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_submission_id ON public.chat_sessions(submission_id);

-- Step 4: Update RLS policies to handle unified submissions
-- Allow users to view submissions for forms they own (includes chat submissions)
DROP POLICY IF EXISTS "Form owners can view submissions" ON public.form_submissions;
CREATE POLICY "Form owners can view all submissions" 
  ON public.form_submissions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_submissions.form_id 
    AND forms.user_id = auth.uid()
  ));

-- Allow authenticated users to create submissions (including chat)
DROP POLICY IF EXISTS "Authenticated users can submit to any form" ON public.form_submissions;
CREATE POLICY "Authenticated users can create submissions" 
  ON public.form_submissions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Step 5: Create function to automatically create unified submission for chat sessions
CREATE OR REPLACE FUNCTION public.create_unified_chat_submission(
  p_session_id UUID,
  p_summary_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_record RECORD;
  submission_id UUID;
  chat_summary JSONB;
  session_duration INTEGER;
BEGIN
  -- Get session details
  SELECT 
    cs.form_id,
    cs.form_field_id,
    cs.user_id,
    cs.total_messages,
    cs.created_at,
    cs.last_activity,
    cs.full_transcript
  INTO session_record
  FROM public.chat_sessions cs
  WHERE cs.id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat session not found: %', p_session_id;
  END IF;

  -- Calculate session duration in seconds
  session_duration := EXTRACT(EPOCH FROM (session_record.last_activity - session_record.created_at))::INTEGER;

  -- Generate chat summary if not provided
  chat_summary := COALESCE(p_summary_data, jsonb_build_object(
    session_record.form_field_id, jsonb_build_object(
      'type', 'chat',
      'sessionId', p_session_id,
      'messageCount', session_record.total_messages,
      'conversationDuration', session_duration,
      'summaryResponse', CASE 
        WHEN session_record.total_messages > 0 
        THEN 'Chat conversation completed with ' || session_record.total_messages || ' messages'
        ELSE 'No messages in conversation'
      END,
      'keyMessages', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'role', role,
            'content', CASE 
              WHEN length(content) > 100 
              THEN substring(content from 1 for 100) || '...'
              ELSE content
            END,
            'timestamp', created_at,
            'importance', CASE 
              WHEN role = 'user' THEN 'high'
              ELSE 'medium'
            END
          ) ORDER BY message_index
        ) FROM public.chat_messages 
        WHERE session_id = p_session_id 
        LIMIT 5),
        '[]'::jsonb
      ),
      'transcriptReference', p_session_id::text
    )
  ));

  -- Create unified submission record
  INSERT INTO public.form_submissions (
    form_id,
    user_id,
    submission_type,
    data,
    completion_time_seconds,
    total_interactions,
    chat_session_references,
    metadata,
    submitted_at
  ) VALUES (
    session_record.form_id,
    session_record.user_id,
    'chat',
    chat_summary,
    session_duration,
    session_record.total_messages,
    jsonb_build_array(p_session_id),
    jsonb_build_object(
      'chatSessionsCount', 1,
      'formType', 'chat',
      'totalInteractions', session_record.total_messages,
      'conversationDuration', session_duration,
      'fieldId', session_record.form_field_id
    ),
    session_record.last_activity
  ) RETURNING id INTO submission_id;

  -- Link the session back to the submission
  UPDATE public.chat_sessions 
  SET submission_id = submission_id
  WHERE id = p_session_id;

  RETURN submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to merge traditional and chat responses for hybrid forms
CREATE OR REPLACE FUNCTION public.create_hybrid_submission(
  p_form_id UUID,
  p_user_id UUID,
  p_traditional_data JSONB,
  p_chat_sessions JSONB DEFAULT '[]',
  p_completion_time INTEGER DEFAULT NULL,
  p_pages_visited JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  submission_id UUID;
  total_chat_messages INTEGER := 0;
  session_count INTEGER;
  combined_data JSONB;
  chat_references JSONB := '[]';
BEGIN
  -- Count total messages and build session references
  SELECT 
    COALESCE(SUM((value->>'messageCount')::INTEGER), 0),
    COUNT(*),
    jsonb_agg(value->>'sessionId')
  INTO total_chat_messages, session_count, chat_references
  FROM jsonb_array_elements(p_chat_sessions);

  -- Combine traditional and chat data
  combined_data := p_traditional_data;
  
  -- Add chat responses under special key
  IF session_count > 0 THEN
    combined_data := combined_data || jsonb_build_object('_chatResponses', p_chat_sessions);
  END IF;

  -- Create hybrid submission
  INSERT INTO public.form_submissions (
    form_id,
    user_id,
    submission_type,
    data,
    completion_time_seconds,
    total_interactions,
    chat_session_references,
    pages_visited,
    metadata,
    submitted_at
  ) VALUES (
    p_form_id,
    p_user_id,
    CASE WHEN session_count > 0 THEN 'hybrid' ELSE 'traditional' END,
    combined_data,
    p_completion_time,
    COALESCE(jsonb_array_length(p_traditional_data), 0) + total_chat_messages,
    chat_references,
    p_pages_visited,
    jsonb_build_object(
      'chatSessionsCount', session_count,
      'formType', CASE WHEN session_count > 0 THEN 'hybrid' ELSE 'traditional' END,
      'totalInteractions', COALESCE(jsonb_array_length(p_traditional_data), 0) + total_chat_messages,
      'traditionalFieldsCount', COALESCE(jsonb_array_length(p_traditional_data), 0),
      'chatFieldsCount', session_count
    ),
    NOW()
  ) RETURNING id INTO submission_id;

  -- Link chat sessions to this submission
  IF session_count > 0 THEN
    UPDATE public.chat_sessions 
    SET submission_id = submission_id
    WHERE id = ANY(
      SELECT (value::text)::UUID 
      FROM jsonb_array_elements_text(chat_references)
    );
  END IF;

  RETURN submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create view for unified analytics
CREATE OR REPLACE VIEW public.unified_form_analytics AS
SELECT 
  f.id as form_id,
  f.name as form_name,
  f.user_id,
  
  -- Overall metrics
  COUNT(fs.id) as total_submissions,
  COUNT(CASE WHEN fs.submission_type = 'traditional' THEN 1 END) as traditional_submissions,
  COUNT(CASE WHEN fs.submission_type = 'chat' THEN 1 END) as chat_submissions,
  COUNT(CASE WHEN fs.submission_type = 'hybrid' THEN 1 END) as hybrid_submissions,
  
  -- Engagement metrics
  AVG(fs.completion_time_seconds) as avg_completion_time,
  AVG(fs.total_interactions) as avg_interactions,
  SUM(COALESCE((fs.metadata->>'chatSessionsCount')::INTEGER, 0)) as total_chat_sessions,
  
  -- Time-based metrics
  COUNT(CASE WHEN fs.submitted_at >= CURRENT_DATE THEN 1 END) as submissions_today,
  COUNT(CASE WHEN fs.submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as submissions_week,
  COUNT(CASE WHEN fs.submitted_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as submissions_month,
  
  -- Form classification
  CASE 
    WHEN COUNT(CASE WHEN fs.submission_type = 'chat' THEN 1 END) > 0 
     AND COUNT(CASE WHEN fs.submission_type = 'traditional' THEN 1 END) > 0 THEN 'mixed'
    WHEN COUNT(CASE WHEN fs.submission_type = 'chat' THEN 1 END) > 0 THEN 'chat_only'
    ELSE 'traditional_only'
  END as form_classification,
  
  -- Latest activity
  MAX(fs.submitted_at) as last_submission
  
FROM public.forms f
LEFT JOIN public.form_submissions fs ON f.id = fs.form_id
GROUP BY f.id, f.name, f.user_id;

-- Step 8: Create function to migrate existing chat sessions to unified model
CREATE OR REPLACE FUNCTION public.migrate_existing_chat_sessions()
RETURNS INTEGER AS $$
DECLARE
  session_record RECORD;
  migrated_count INTEGER := 0;
  submission_id UUID;
BEGIN
  -- Find chat sessions without linked submissions
  FOR session_record IN 
    SELECT cs.id, cs.form_id, cs.total_messages
    FROM public.chat_sessions cs
    WHERE cs.submission_id IS NULL 
      AND cs.total_messages > 0
      AND cs.is_active = false -- Only migrate completed sessions
  LOOP
    BEGIN
      -- Create unified submission for this session
      SELECT public.create_unified_chat_submission(session_record.id) INTO submission_id;
      migrated_count := migrated_count + 1;
      
      RAISE NOTICE 'Migrated session % to submission %', session_record.id, submission_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate session %: %', session_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.create_unified_chat_submission(UUID, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_hybrid_submission(UUID, UUID, JSONB, JSONB, INTEGER, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.migrate_existing_chat_sessions() TO authenticated;

-- Step 10: Create trigger to automatically create submission when chat session becomes inactive
CREATE OR REPLACE FUNCTION public.auto_create_chat_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create submission when session becomes inactive and has messages
  IF OLD.is_active = true 
     AND NEW.is_active = false 
     AND NEW.total_messages > 0 
     AND NEW.submission_id IS NULL THEN
    
    PERFORM public.create_unified_chat_submission(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_chat_submission_trigger
  AFTER UPDATE ON public.chat_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_create_chat_submission();

-- Step 11: Add helpful comments
COMMENT ON TABLE public.form_submissions IS 'Unified storage for all form responses - traditional, chat, and hybrid';
COMMENT ON COLUMN public.form_submissions.submission_type IS 'Type of submission: traditional (form fields), chat (conversational), or hybrid (both)';
COMMENT ON COLUMN public.form_submissions.chat_session_references IS 'Array of chat session IDs linked to this submission';
COMMENT ON COLUMN public.form_submissions.metadata IS 'Additional submission metadata including analytics data';
COMMENT ON FUNCTION public.create_unified_chat_submission(UUID, JSONB) IS 'Creates a unified submission record for a completed chat session';
COMMENT ON FUNCTION public.create_hybrid_submission(UUID, UUID, JSONB, JSONB, INTEGER, JSONB) IS 'Creates a unified submission combining traditional form fields and chat responses';
COMMENT ON VIEW public.unified_form_analytics IS 'Comprehensive analytics view combining traditional and chat form metrics';

-- Migration complete
SELECT 'Unified data model migration completed successfully' as result;