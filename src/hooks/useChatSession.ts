import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { ChatMessage } from '@/types/form';
import { toast } from 'sonner';

// Global lock to prevent concurrent saves
const saveLocks = new Map<string, boolean>();

export const useChatSession = () => {
  const { user } = useSupabaseAuth();

  const saveConversationTranscript = useCallback(async (
    formId: string,
    fieldId: string,
    sessionId: string,
    messages: ChatMessage[]
  ) => {
    const lockKey = `${formId}_${fieldId}_${sessionId}`;
    
    // Check if already saving this session
    if (saveLocks.get(lockKey)) {
      console.log('⏳ Save already in progress for session:', sessionId.slice(-8));
      return;
    }

    // Set lock
    saveLocks.set(lockKey, true);

    try {
      console.log('🔒 Acquired save lock for session:', sessionId.slice(-8));
      console.log('💾 Starting save process:', { 
        formId, 
        fieldId, 
        sessionId: sessionId.slice(-8), 
        messageCount: messages.length,
        userAuthenticated: !!user?.id
      });

      // CRITICAL: Clean and deduplicate messages BEFORE saving
      const cleanedMessages = deduplicateMessages(messages);
      
      if (cleanedMessages.length !== messages.length) {
        console.warn(`⚠️ Removed ${messages.length - cleanedMessages.length} duplicate messages before saving`);
      }

      // Prepare the transcript data with proper indexing
      const fullTranscript = cleanedMessages.map((msg, index) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        messageIndex: index
      }));

      // Prepare session data
      const sessionData = {
        form_id: formId,
        form_field_id: fieldId,
        session_key: sessionId,
        conversation_context: cleanedMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })) as any,
        is_active: true,
        total_messages: cleanedMessages.length,
        last_activity: new Date().toISOString(),
        full_transcript: fullTranscript as any,
        user_id: user?.id || null,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Prepared session data:', {
        totalMessages: sessionData.total_messages,
        transcriptLength: fullTranscript.length,
        userId: sessionData.user_id ? 'authenticated' : 'anonymous'
      });

      // First, check if session exists
      const { data: existingSession, error: checkError } = await supabase
        .from('chat_sessions')
        .select('id, total_messages, full_transcript')
        .eq('session_key', sessionId)
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (checkError) {
        console.error('❌ Error checking existing session:', checkError);
        throw checkError;
      }

      let sessionRecord;

      if (existingSession) {
        console.log('🔄 Updating existing session:', existingSession.id);
        console.log('📊 Current vs New:', {
          currentMessages: existingSession.total_messages,
          newMessages: sessionData.total_messages,
          currentTranscriptLength: Array.isArray(existingSession.full_transcript) ? existingSession.full_transcript.length : 0,
          newTranscriptLength: fullTranscript.length
        });

        // IMPORTANT: Use UPDATE with WHERE clause, not UPSERT
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update(sessionData)
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating session:', updateError);
          throw updateError;
        }

        sessionRecord = updatedSession;
        console.log('✅ Session updated successfully');
      } else {
        console.log('🆕 Creating new session');
        
        const { data: newSession, error: insertError } = await supabase
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating session:', insertError);
          throw insertError;
        }

        sessionRecord = newSession;
        console.log('✅ New session created:', sessionRecord.id);
      }

      // Handle chat_messages table (secondary storage)
      console.log('🗂️ Managing chat_messages table...');
      
      // Delete existing messages for this session
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionRecord.id);

      if (deleteError) {
        console.error('⚠️ Error deleting old messages (non-critical):', deleteError);
        // Don't throw here - this is secondary storage
      }

      // Insert new messages if any exist
      if (cleanedMessages.length > 0) {
        const messageInserts = cleanedMessages.map((msg, index) => ({
          session_id: sessionRecord.id,
          role: msg.type === 'user' ? 'user' : msg.type === 'error' ? 'system' : 'assistant',
          content: msg.content,
          message_type: msg.type === 'error' ? 'error' : 'text',
          message_index: index,
          metadata: {
            timestamp: msg.timestamp.toISOString(),
            messageId: msg.id,
            originalType: msg.type
          }
        }));

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .insert(messageInserts);

        if (messagesError) {
          console.error('⚠️ Error saving messages to chat_messages (non-critical):', messagesError);
          // Don't throw here - main transcript is saved in chat_sessions
        } else {
          console.log('✅ Messages saved to chat_messages table');
        }
      }

      console.log('🎉 Save process completed successfully');

    } catch (error) {
      console.error('💥 Error in saveConversationTranscript:', error);
      toast.error('Failed to save conversation');
      throw error;
    } finally {
      // Always release the lock
      saveLocks.delete(lockKey);
      console.log('🔓 Released save lock for session:', sessionId.slice(-8));
    }
  }, [user?.id]);

  const loadConversationHistory = useCallback(async (
    formId: string,
    fieldId: string,
    sessionId: string
  ): Promise<ChatMessage[]> => {
    try {
      console.log('📖 Loading conversation history:', { 
        formId, 
        fieldId, 
        sessionId: sessionId.slice(-8) 
      });
      
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, full_transcript, total_messages, conversation_context')
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .eq('session_key', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error('❌ Error loading session:', sessionError);
        return [];
      }

      if (!session) {
        console.log('📭 No existing session found');
        return [];
      }

      console.log('📋 Found session:', {
        id: session.id,
        totalMessages: session.total_messages,
        hasTranscript: !!session.full_transcript,
        transcriptLength: Array.isArray(session.full_transcript) ? session.full_transcript.length : 0
      });

      // Try to use full_transcript first
      if (session.full_transcript && Array.isArray(session.full_transcript)) {
        console.log('📜 Using full_transcript from session');
        
        const rawMessages = session.full_transcript as any[];
        const cleanedMessages = deduplicateMessages(rawMessages.map(msg => ({
          id: msg.id || `msg_${Date.now()}_${Math.random()}`,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        })));

        if (cleanedMessages.length !== rawMessages.length) {
          console.warn(`⚠️ Removed ${rawMessages.length - cleanedMessages.length} duplicates during load`);
        }

        console.log(`✅ Loaded ${cleanedMessages.length} messages from full_transcript`);
        return cleanedMessages;
      }

      // Fallback to chat_messages table
      console.log('🔄 Fallback: Loading from chat_messages table...');
      
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('message_index', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages from chat_messages:', messagesError);
        return [];
      }

      if (!messages || messages.length === 0) {
        console.log('📭 No messages found in chat_messages table');
        return [];
      }

      const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
        id: msg.metadata?.messageId || msg.id,
        type: msg.role === 'user' ? 'user' : msg.message_type === 'error' ? 'error' : 'bot',
        content: msg.content,
        timestamp: new Date(msg.metadata?.timestamp || msg.created_at)
      }));

      const cleanedMessages = deduplicateMessages(chatMessages);
      console.log(`✅ Loaded ${cleanedMessages.length} messages from chat_messages table`);
      return cleanedMessages;

    } catch (error) {
      console.error('💥 Error loading conversation history:', error);
      return [];
    }
  }, []);

  return {
    saveConversationTranscript,
    loadConversationHistory
  };
};

// Utility function to remove duplicate messages
function deduplicateMessages(messages: ChatMessage[] | any[]): ChatMessage[] {
  if (!Array.isArray(messages)) {
    console.warn('⚠️ deduplicateMessages received non-array:', typeof messages);
    return [];
  }

  const seen = new Set<string>();
  const deduplicated: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      console.warn('⚠️ Skipping invalid message:', msg);
      continue;
    }

    // Create a unique key for each message
    const messageKey = `${msg.type || 'unknown'}:${msg.content || ''}:${new Date(msg.timestamp || 0).getTime()}`;
    
    if (!seen.has(messageKey)) {
      seen.add(messageKey);
      deduplicated.push({
        id: msg.id || `dedup_${Date.now()}_${Math.random()}`,
        type: msg.type || 'bot',
        content: msg.content || '',
        timestamp: new Date(msg.timestamp || Date.now())
      });
    } else {
      console.log('🗑️ Removing duplicate message:', msg.content?.substring(0, 50) + '...');
    }
  }

  // Sort by timestamp to ensure proper order
  deduplicated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  console.log(`🧹 Deduplication: ${messages.length} → ${deduplicated.length} messages`);
  return deduplicated;
}