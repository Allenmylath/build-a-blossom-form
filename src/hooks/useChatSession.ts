
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'error';
  content: string;
  timestamp: Date;
  messageIndex: number;
}

interface ChatSessionData {
  id: string;
  formId: string;
  formFieldId: string;
  sessionKey: string;
  conversationContext: any[];
  isActive: boolean;
  totalMessages: number;
}

export const useChatSession = (formId: string, fieldId: string) => {
  const { user } = useSupabaseAuth();
  const [session, setSession] = useState<ChatSessionData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionKeyRef = useRef<string>('');

  // Generate or retrieve session key for anonymous users
  useEffect(() => {
    if (!sessionKeyRef.current) {
      sessionKeyRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Initialize or retrieve existing session
  useEffect(() => {
    const initializeSession = async () => {
      if (!formId || !fieldId) return;

      try {
        // First try to find existing session
        let { data: existingSession, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('form_id', formId)
          .eq('form_field_id', fieldId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching existing session:', error);
          return;
        }

        let sessionData: any = existingSession?.[0];

        // Create new session if none exists
        if (!sessionData) {
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              form_id: formId,
              form_field_id: fieldId,
              user_id: user?.id || null,
              session_key: sessionKeyRef.current,
              conversation_context: [],
              is_active: true,
              total_messages: 0
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating session:', createError);
            return;
          }

          sessionData = newSession;
        }

        setSession({
          id: sessionData.id,
          formId: sessionData.form_id,
          formFieldId: sessionData.form_field_id,
          sessionKey: sessionData.session_key,
          conversationContext: sessionData.conversation_context || [],
          isActive: sessionData.is_active,
          totalMessages: sessionData.total_messages || 0
        });

        // Load existing messages for this session
        await loadMessages(sessionData.id);

      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, [formId, fieldId, user?.id]);

  const loadMessages = async (sessionId: string) => {
    try {
      const { data: chatMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: ChatMessage[] = (chatMessages || []).map((msg: any) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : msg.message_type === 'error' ? 'error' : 'bot',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        messageIndex: msg.message_index
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const addMessage = async (type: 'user' | 'bot' | 'error', content: string) => {
    if (!session) return null;

    try {
      const messageIndex = session.totalMessages;
      const role = type === 'user' ? 'user' : type === 'error' ? 'system' : 'assistant';

      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          chat_id: null,
          role: role,
          content: content,
          message_type: type === 'error' ? 'error' : 'text',
          message_index: messageIndex,
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      const formattedMessage: ChatMessage = {
        id: newMessage.id,
        type: type,
        content: content,
        timestamp: new Date(newMessage.created_at),
        messageIndex: messageIndex
      };

      setMessages(prev => [...prev, formattedMessage]);
      
      // Update session total messages count
      setSession(prev => prev ? {
        ...prev,
        totalMessages: prev.totalMessages + 1
      } : null);

      return formattedMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  };

  const sendMessage = async (content: string) => {
    if (!session || isLoading) return;

    setIsLoading(true);

    try {
      // Add user message first
      await addMessage('user', content);

      // Call the chat API
      const response = await fetch('/api/chat-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: session.id,
          formId: session.formId,
          fieldId: session.formFieldId,
          conversationContext: session.conversationContext
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = data.message || data.response || 'I received your message.';
      
      // Add bot response
      await addMessage('bot', botResponse);

      // Update conversation context
      if (data.conversationContext) {
        setSession(prev => prev ? {
          ...prev,
          conversationContext: data.conversationContext
        } : null);
      }

    } catch (error) {
      console.error('Chat API Error:', error);
      await addMessage('error', 'Sorry, I\'m having trouble connecting right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    messages,
    isLoading,
    sendMessage,
    addMessage
  };
};
