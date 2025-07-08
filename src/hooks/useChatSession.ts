
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionKeyRef = useRef<string>('');
  const initializationRef = useRef<Promise<void> | null>(null);

  // Generate or retrieve session key for anonymous users
  useEffect(() => {
    if (!sessionKeyRef.current) {
      sessionKeyRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Initialize or retrieve existing session with proper error handling
  const initializeSession = useCallback(async () => {
    if (!formId || !fieldId || isInitialized) return;

    try {
      console.log('Initializing chat session for form:', formId, 'field:', fieldId);

      // First try to find existing active session
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('form_id', formId)
        .eq('form_field_id', fieldId)
        .eq('session_key', sessionKeyRef.current)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing session:', fetchError);
        toast.error('Failed to load chat session');
        return;
      }

      let sessionData: any = existingSession?.[0];

      // Create new session if none exists
      if (!sessionData) {
        console.log('Creating new chat session');
        const sessionInsert: {
          form_id: string;
          form_field_id: string;
          session_key: string;
          conversation_context: any[];
          is_active: boolean;
          total_messages: number;
          user_id?: string;
        } = {
          form_id: formId,
          form_field_id: fieldId,
          session_key: sessionKeyRef.current,
          conversation_context: [],
          is_active: true,
          total_messages: 0
        };

        // Only add user_id if user is authenticated
        if (user?.id) {
          sessionInsert.user_id = user.id;
        }

        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert(sessionInsert)
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          toast.error('Failed to create chat session');
          return;
        }

        sessionData = newSession;
        console.log('Created new session:', sessionData.id);
      } else {
        console.log('Using existing session:', sessionData.id);
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
      setIsInitialized(true);

    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to initialize chat session');
    }
  }, [formId, fieldId, user?.id, isInitialized]);

  // Initialize session with race condition protection
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = initializeSession();
    }
    return () => {
      initializationRef.current = null;
    };
  }, [initializeSession]);

  const loadMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId);
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
      console.log('Loaded', formattedMessages.length, 'messages');
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const addMessage = async (type: 'user' | 'bot' | 'error', content: string) => {
    if (!session) {
      console.error('No session available for adding message');
      return null;
    }

    try {
      const messageIndex = session.totalMessages;
      const role = type === 'user' ? 'user' : type === 'error' ? 'system' : 'assistant';

      console.log('Adding message:', { type, role, messageIndex, sessionId: session.id });

      // Create a dummy chat_id to satisfy the foreign key constraint
      // We'll use the session_id as the chat_id since they're both UUIDs
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          chat_id: session.id, // Use session_id to satisfy foreign key constraint
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
        toast.error('Failed to save message');
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

      console.log('Message added successfully:', formattedMessage.id);
      return formattedMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to save message');
      return null;
    }
  };

  const sendMessage = async (content: string) => {
    if (!session || isLoading) {
      console.log('Cannot send message: no session or already loading');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending message to chat API');
      
      // Add user message first
      const userMessage = await addMessage('user', content);
      if (!userMessage) {
        throw new Error('Failed to save user message');
      }

      // Call the chat API with proper error handling
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
        const errorText = await response.text();
        console.error('Chat API error:', response.status, errorText);
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botResponse = data.message || data.response || 'I received your message.';
      
      // Add bot response
      const botMessage = await addMessage('bot', botResponse);
      if (!botMessage) {
        throw new Error('Failed to save bot response');
      }

      // Update conversation context if provided
      if (data.conversationContext) {
        setSession(prev => prev ? {
          ...prev,
          conversationContext: data.conversationContext
        } : null);
      }

      console.log('Message exchange completed successfully');

    } catch (error) {
      console.error('Chat API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await addMessage('error', `Sorry, I encountered an error: ${errorMessage}. Please try again.`);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    messages,
    isLoading,
    isInitialized,
    sendMessage,
    addMessage
  };
};
