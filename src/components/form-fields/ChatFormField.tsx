
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { FormField } from '@/types/form';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'error';
  content: string;
  timestamp: Date;
}

interface ChatFormFieldProps {
  field: FormField;
  value?: string[];
  onChange: (messages: string[]) => void;
  error?: string;
}

export const ChatFormField = ({ field, value = [], onChange, error }: ChatFormFieldProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const botName = field.chatConfig?.botName || 'Assistant';
  const welcomeMessage = field.chatConfig?.welcomeMessage || 'Hello! How can I help you?';
  const apiUrl = field.chatConfig?.apiUrl || '/api/chat';

  useEffect(() => {
    // Add welcome message
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'bot',
      content: welcomeMessage,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    inputRef.current?.focus();
  }, [welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Update form data with chat messages
    const messageTexts = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content);
    onChange(messageTexts);
  }, [messages, onChange]);

  const addMessage = (type: 'user' | 'bot' | 'error', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately
    addMessage('user', userMessage);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          fieldId: field.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = data.message || data.response || data.reply || 'I received your message.';
      
      addMessage('bot', botResponse);

    } catch (error) {
      console.error('Chat API Error:', error);
      addMessage('error', 'Sorry, I\'m having trouble connecting right now. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
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

  const getMessageColor = (type: ChatMessage['type']) => {
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
    </div>
  );
};
