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
      // First, create or update the chat session
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
        full_transcript: messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })) as any,
        user_id: user?.id || null
      };

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert(sessionData, { 
          onConflict: 'session_key,form_id,form_field_id'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error saving chat session:', sessionError);
        toast.error('Failed to save conversation');
        return;
      }

      // Save individual messages to chat_messages table
      const messageInserts = messages.map((msg, index) => ({
        session_id: session.id,
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
        .eq('session_id', session.id);

      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert(messageInserts);

      if (messagesError) {
        console.error('Error saving chat messages:', messagesError);
        toast.error('Failed to save conversation messages');
        return;
      }

      console.log('Conversation saved successfully:', session.id);
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
      // First get the session
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .eq('session_key', sessionId)
        .single();

      if (sessionError || !session) {
        console.log('No existing session found');
        return [];
      }

      // Get messages for this session
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