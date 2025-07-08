import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { FormField, ChatMessage, ConversationTranscript } from '@/types/form';
import { useChatSession } from '@/hooks/useChatSession';

interface ChatFormFieldProps {
  field: FormField;
  value?: ConversationTranscript;
  onChange: (transcript: ConversationTranscript) => void;
  error?: string;
  formId?: string;
}

export const ChatFormField = ({ field, value, onChange, error, formId }: ChatFormFieldProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(value?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { saveConversationTranscript } = useChatSession();

  const botName = field.chatConfig?.botName || 'Assistant';
  const welcomeMessage = field.chatConfig?.welcomeMessage || 'Hello! How can I help you?';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Initialize with welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: `welcome_${Date.now()}`,
        type: 'bot',
        content: welcomeMessage,
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    }
  }, [welcomeMessage]);

  useEffect(() => {
    // Update form value whenever messages change
    const transcript: ConversationTranscript = {
      messages,
      sessionId,
      totalMessages: messages.length
    };
    onChange(transcript);
  }, [messages, sessionId, onChange]);

  const callGeminiAPI = async (messageHistory: ChatMessage[]): Promise<string> => {
    // Use environment variable for API key
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Convert message history to Gemini format (limit to last 10 messages for context)
    const recentMessages = messageHistory.slice(-10);
    const contents = recentMessages.map((msg) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt at the beginning
    const systemContents = [
      {
        role: 'user',
        parts: [{ text: 'You are a helpful AI assistant integrated into a form. Please provide helpful and accurate responses to user questions.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m here to help answer questions and assist users with their inquiries. How can I help you today?' }]
      },
      ...contents
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      // Call Gemini API
      const botResponse = await callGeminiAPI(updatedMessages);
      
      // Add bot response
      const newBotMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, newBotMessage];
      setMessages(finalMessages);

      // Save conversation to Supabase
      if (formId) {
        await saveConversationTranscript(formId, field.id, sessionId, finalMessages);
      }

    } catch (error) {
      console.error('Chat API Error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'error',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-600 text-white';
      case 'bot': return 'bg-gray-100 text-gray-900';
      case 'error': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Card className="w-full h-[400px] flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${getMessageColor(message.type)}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : botName}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs text-gray-600">{botName} is typing...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Session info */}
      <div className="text-xs text-gray-500 mt-2">
        Session: {messages.length} messages
      </div>
    </div>
  );
};