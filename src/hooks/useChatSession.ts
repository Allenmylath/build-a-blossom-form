// Updated useChatSession.ts with better session management

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { ChatMessage } from '@/types/form';
import { toast } from 'sonner';

export const useChatSession = () => {
  const { user } = useSupabaseAuth();

  const saveConversationTranscript = useCallback(async (
    formId: string,
    fieldId: string,
    sessionId: string,
    messages: ChatMessage[]
  ) => {
    try {
      console.log('Saving conversation transcript:', { formId, fieldId, sessionId, messageCount: messages.length });

      // Check if session already exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('id, user_id')
        .eq('session_key', sessionId)
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing session:', fetchError);
        return;
      }

      // Prepare session data
      const sessionData = {
        form_id: formId,
        form_field_id: fieldId,
        session_key: sessionId,
        conversation_context: messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })) as any,
        is_active: true,
        total_messages: messages.length,
        last_activity: new Date().toISOString(),
        full_transcript: messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })) as any,
        user_id: user?.id || null
      };

      let sessionRecord;

      if (existingSession) {
        // Update existing session
        console.log('Updating existing session:', existingSession.id);
        
        // If user was null before but now we have a user, update the user_id
        if (!existingSession.user_id && user?.id) {
          sessionData.user_id = user.id;
          console.log('Updating session with new user ID:', user.id);
        }

        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update(sessionData)
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating chat session:', updateError);
          toast.error('Failed to save conversation');
          return;
        }

        sessionRecord = updatedSession;
      } else {
        // Create new session
        console.log('Creating new session');
        
        const { data: newSession, error: insertError } = await supabase
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating chat session:', insertError);
          toast.error('Failed to save conversation');
          return;
        }

        sessionRecord = newSession;
      }

      // Save individual messages to chat_messages table
      const messageInserts = messages.map((msg, index) => ({
        session_id: sessionRecord.id,
        role: msg.type === 'user' ? 'user' : msg.type === 'error' ? 'system' : 'assistant',
        content: msg.content,
        message_type: msg.type === 'error' ? 'error' : 'text',
        message_index: index,
        metadata: {
          timestamp: msg.timestamp.toISOString(),
          messageId: msg.id
        }
      }));

      // Delete existing messages for this session and insert new ones
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionRecord.id);

      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert(messageInserts);

      if (messagesError) {
        console.error('Error saving chat messages:', messagesError);
        toast.error('Failed to save conversation messages');
        return;
      }

      console.log('Conversation saved successfully:', sessionRecord.id);
    } catch (error) {
      console.error('Error in saveConversationTranscript:', error);
      toast.error('Failed to save conversation');
    }
  }, [user?.id]);

  const loadConversationHistory = useCallback(async (
    formId: string,
    fieldId: string,
    sessionId: string
  ): Promise<ChatMessage[]> => {
    try {
      console.log('Loading conversation history:', { formId, fieldId, sessionId });
      
      // First get the session
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .eq('session_key', sessionId)
        .single();

      if (sessionError || !session) {
        console.log('No existing session found:', sessionError?.message);
        return [];
      }

      // If session has full_transcript, use that
      if (session.full_transcript && Array.isArray(session.full_transcript)) {
        console.log('Using full_transcript from session');
        const chatMessages: ChatMessage[] = session.full_transcript.map((msg: any) => ({
          id: msg.id || `msg_${Date.now()}_${Math.random()}`,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        return chatMessages;
      }

      // Fallback: Get messages from chat_messages table
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('message_index', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return [];
      }

      // Convert to ChatMessage format
      const chatMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
        id: msg.metadata?.messageId || msg.id,
        type: msg.role === 'user' ? 'user' : msg.message_type === 'error' ? 'error' : 'bot',
        content: msg.content,
        timestamp: new Date(msg.metadata?.timestamp || msg.created_at)
      }));

      console.log('Loaded', chatMessages.length, 'messages from chat_messages table');
      return chatMessages;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }, []);

  return {
    saveConversationTranscript,
    loadConversationHistory
  };
};