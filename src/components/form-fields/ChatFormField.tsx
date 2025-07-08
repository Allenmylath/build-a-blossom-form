import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, User, Bot, AlertTriangle } from 'lucide-react';
import { FormField, ChatMessage, ConversationTranscript } from '@/types/form';
import { useChatSession } from '@/hooks/useChatSession';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface ChatFormFieldProps {
  field: FormField;
  value?: ConversationTranscript;
  onChange: (transcript: ConversationTranscript) => void;
  error?: string;
  formId?: string;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const ChatFormField = ({ field, value, onChange, error, formId }: ChatFormFieldProps) => {
  const { user } = useSupabaseAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(value?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaveHash, setLastSaveHash] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Create persistent session ID based on form, field, and browser session
  const [sessionId] = useState(() => {
    if (!formId || !field.id) {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Create a persistent session key based on form, field, and browser session
    const browserSessionKey = sessionStorage.getItem('browser_session_id') || 
      (() => {
        const newKey = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('browser_session_id', newKey);
        return newKey;
      })();
    
    return `session_${formId}_${field.id}_${browserSessionKey}`;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { saveConversationTranscript, loadConversationHistory } = useChatSession();

  const botName = field.chatConfig?.botName || 'Assistant';
  const welcomeMessage = field.chatConfig?.welcomeMessage || 'Hello! How can I help you?';

  // Generate unique message ID
  const generateMessageId = useCallback((type: string) => {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }, []);

  // Create conversation hash to prevent duplicate saves
  const createConversationHash = useCallback((messages: ChatMessage[]) => {
    return messages
      .map(m => `${m.type}:${m.content}:${m.timestamp.getTime()}`)
      .join('|');
  }, []);

  // Update form value callback
  const updateFormValue = useCallback((newMessages: ChatMessage[]) => {
    const transcript: ConversationTranscript = {
      messages: newMessages,
      sessionId,
      totalMessages: newMessages.length
    };
    onChange(transcript);
  }, [sessionId, onChange]);

  // Debounced save function to prevent duplicate saves
  const saveConversationDebounced = useCallback(
    debounce(async (messages: ChatMessage[]) => {
      if (!formId || messages.length === 0) {
        console.log('Skipping save - no formId or empty messages');
        return;
      }
      
      // Create a hash of the conversation to prevent duplicate saves
      const conversationHash = createConversationHash(messages);
      
      if (conversationHash === lastSaveHash) {
        console.log('⏭️ Skipping duplicate save - same conversation hash');
        return;
      }
      
      try {
        console.log('💾 Saving conversation:', {
          sessionId: sessionId.slice(-8),
          messageCount: messages.length,
          hashPreview: conversationHash.substring(0, 50) + '...'
        });
        
        await saveConversationTranscript(formId, field.id, sessionId, messages);
        setLastSaveHash(conversationHash);
        console.log('✅ Conversation saved successfully');
      } catch (error) {
        console.error('❌ Failed to save conversation:', error);
      }
    }, 1000), // 1 second debounce
    [formId, field.id, sessionId, saveConversationTranscript, lastSaveHash, createConversationHash]
  );

  // Load existing conversation on mount
  useEffect(() => {
    if (formId && field.id && sessionId && !isInitialized) {
      setIsInitialized(true);
      
      console.log('🔄 Loading conversation history for session:', sessionId.slice(-8));
      
      loadConversationHistory(formId, field.id, sessionId)
        .then((history) => {
          if (history.length > 0) {
            console.log('📜 Loaded conversation history:', history.length, 'messages');
            setMessages(history);
          } else {
            console.log('🆕 No existing history, initializing with welcome message');
            // Initialize with welcome message only if no history
            const welcomeMsg: ChatMessage = {
              id: generateMessageId('welcome'),
              type: 'bot',
              content: welcomeMessage,
              timestamp: new Date()
            };
            setMessages([welcomeMsg]);
          }
        })
        .catch(error => {
          console.error('❌ Error loading conversation history:', error);
          // Fallback to welcome message
          const welcomeMsg: ChatMessage = {
            id: generateMessageId('welcome'),
            type: 'bot',
            content: welcomeMessage,
            timestamp: new Date()
          };
          setMessages([welcomeMsg]);
        });
    }
  }, [formId, field.id, sessionId, isInitialized, loadConversationHistory, welcomeMessage, generateMessageId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Update form value when messages change (but don't save to database here)
  useEffect(() => {
    if (messages.length > 0) {
      updateFormValue(messages);
    }
  }, [messages, updateFormValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Gemini API call function
  const callGeminiAPI = async (messageHistory: ChatMessage[]): Promise<string> => {
    // Note: In production, move this to a secure backend/edge function
    const GEMINI_API_KEY = 'AIzaSyBiC8GdELF2JmUfpB_qF4yCbbu3UI6TCZU';
    
    try {
      // Convert message history to Gemini format (limit to last 10 messages for context)
      const recentMessages = messageHistory.slice(-10);
      const contents = recentMessages
        .filter(msg => msg.type !== 'error') // Exclude error messages from API context
        .map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

      // Add system prompt at the beginning
      const systemContents = [
        {
          role: 'user',
          parts: [{ text: 'You are a helpful AI assistant integrated into a form. Please provide helpful and accurate responses to user questions. Keep responses concise and friendly.' }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m here to help answer questions and assist users with their inquiries. How can I help you today?' }]
        },
        ...contents
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: systemContents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    console.log('📤 Sending message:', userMessage.substring(0, 50) + '...');

    try {
      // Add user message
      const newUserMessage: ChatMessage = {
        id: generateMessageId('user'),
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      // Call Gemini API
      console.log('🤖 Calling Gemini API...');
      const botResponse = await callGeminiAPI(updatedMessages);
      
      // Add bot response
      const newBotMessage: ChatMessage = {
        id: generateMessageId('bot'),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, newBotMessage];
      setMessages(finalMessages);

      console.log('✅ Message exchange complete, scheduling save...');
      
      // Save conversation with debouncing
      saveConversationDebounced(finalMessages);

    } catch (error) {
      console.error('❌ Chat API Error:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId('error'),
        type: 'error',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      const finalMessages = [...messages.slice(0, -1), errorMessage]; // Replace the user message with error
      setMessages(finalMessages);
      
      // Save even error conversations
      saveConversationDebounced(finalMessages);
    } finally {
      setIsLoading(false);
      // Focus input after a short delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message styling based on type
  const getMessageStyling = (type: string) => {
    switch (type) {
      case 'user': 
        return {
          container: 'justify-end',
          bubble: 'bg-blue-600 text-white',
          icon: <User className="w-3 h-3" />
        };
      case 'bot': 
        return {
          container: 'justify-start',
          bubble: 'bg-gray-100 text-gray-900 border',
          icon: <Bot className="w-3 h-3" />
        };
      case 'error': 
        return {
          container: 'justify-start',
          bubble: 'bg-red-100 text-red-800 border border-red-200',
          icon: <AlertTriangle className="w-3 h-3" />
        };
      default: 
        return {
          container: 'justify-start',
          bubble: 'bg-gray-100 text-gray-900 border',
          icon: <Bot className="w-3 h-3" />
        };
    }
  };

  // Get display name for message type
  const getMessageDisplayName = (type: string) => {
    switch (type) {
      case 'user': return 'You';
      case 'bot': return botName;
      case 'error': return 'Error';
      default: return botName;
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Card className="w-full h-[400px] flex flex-col border-gray-200">
        {/* Session Info Header */}
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-3 h-3" />
            <span>Session: {sessionId.split('_').pop()?.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-1">
            {user ? (
              <>
                <User className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Authenticated</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-gray-400" />
                <span>Anonymous</span>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((message) => {
              const styling = getMessageStyling(message.type);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${styling.container}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${styling.bubble} shadow-sm`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {styling.icon}
                      <span className="text-xs font-medium">
                        {getMessageDisplayName(message.type)}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-600">{botName} is typing...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-white"
              disabled={isLoading}
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>{inputMessage.length}/500 characters</span>
            <span>{messages.length} messages</span>
          </div>
        </div>
      </Card>
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded">
          <div>Session ID: {sessionId}</div>
          <div>Messages: {messages.length}</div>
          <div>User: {user ? user.email : 'Anonymous'}</div>
          <div>Form ID: {formId || 'Not provided'}</div>
        </div>
      )}
    </div>
  );
};