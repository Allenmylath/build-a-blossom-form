import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'error';
  content: string;
  timestamp: Date;
}

interface ConversationalFormProps {
  apiUrl?: string;
  botName?: string;
  conversationId?: string;
}

export const ConversationalForm = ({ 
  apiUrl = '/api/chat', 
  botName = 'Assistant',
  conversationId
}: ConversationalFormProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(
    conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message
    addBotMessage("Hello! I'm your AI assistant. How can I help you today?");
    
    // Focus input
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'bot' | 'error', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const addBotMessage = (content: string) => addMessage('bot', content);
  const addErrorMessage = (content: string) => addMessage('error', content);

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
          conversationId: currentConversationId,
          timestamp: new Date().toISOString(),
          // Optional: Add user context
          metadata: {
            userAgent: navigator.userAgent,
            sessionId: currentConversationId,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.error) {
        throw new Error(data.error);
      }

      const botResponse = data.message || data.response || data.reply || 'I received your message but couldn\'t generate a response.';
      
      // Update conversation ID if server provides a new one
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }

      addBotMessage(botResponse);

    } catch (error) {
      console.error('Chat API Error:', error);
      
      let errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to the chat service. Please check your connection.';
        } else if (error.message.includes('HTTP 429')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'The chat service is experiencing issues. Please try again later.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      addErrorMessage(errorMessage);
      
      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive",
      });

    } finally {
      setIsLoading(false);
      // Re-focus input for better UX
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

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    addBotMessage("Chat cleared. How can I help you?");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">AI Chat Assistant</h2>
              <p className="text-sm text-gray-600">Powered by {botName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              ID: {currentConversationId.slice(-8)}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={clearChat}
              className="h-8"
            >
              <Settings className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] rounded-lg px-4 py-3 ${getMessageColor(message.type)}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
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
              <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">{botName} is typing...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
            maxLength={1000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </p>
          <p className="text-xs text-gray-400">
            {inputMessage.length}/1000
          </p>
        </div>
      </div>
    </Card>
  );
};
