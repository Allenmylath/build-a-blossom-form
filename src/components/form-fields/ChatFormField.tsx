import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, User, Bot, AlertTriangle, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { FormField, ChatMessage, ConversationTranscript } from '@/types/form';
import { useChatSession } from '@/hooks/useChatSession';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { 
  usePipecatClient, 
  useRTVIClientEvent, 
  usePipecatClientMicControl,
  usePipecatClientMediaDevices,
  usePipecatClientTransportState 
} from "@pipecat-ai/client-react";
import { RTVIEvent, TransportState } from "@pipecat-ai/client-js";
import { useToast } from "@/hooks/use-toast";

interface ChatFormFieldProps {
  field: FormField;
  value?: ConversationTranscript;
  onChange: (transcript: ConversationTranscript) => void;
  error?: string;
  formId?: string;
  pipecatEndpoint?: string;
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

export const ChatFormField = ({ 
  field, 
  value, 
  onChange, 
  error, 
  formId,
  pipecatEndpoint = "/api/connect"
}: ChatFormFieldProps) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(value?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSaveHash, setLastSaveHash] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Pipecat/RTVI hooks (following working ChatConsole pattern)
  const pipecatClient = usePipecatClient();
  const { enableMic, isMicEnabled } = usePipecatClientMicControl();
  const { availableMics, selectedMic, updateMic } = usePipecatClientMediaDevices();
  const transportState = usePipecatClientTransportState();
  
  // ✅ SIMPLIFIED: Direct transport state checks (matching ChatConsole)
  const isConnected = transportState === "connected" || transportState === "ready";
  const isConnecting = transportState === "connecting" || 
                      transportState === "initializing" || 
                      transportState === "initialized" || 
                      transportState === "authenticating" || 
                      transportState === "authenticated";
  const isDisconnected = transportState === "disconnected";
  const hasError = transportState === "error";

  // Create persistent session ID based on form, field, and browser session
  const [sessionId] = useState(() => {
    if (!formId || !field.id) {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
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
    }, 1000),
    [formId, field.id, sessionId, saveConversationTranscript, lastSaveHash, createConversationHash]
  );

  // RTVI Event Handlers (matching ChatConsole pattern)

  // Listen to user transcription events - FINAL ONLY (matching ChatConsole)
  useRTVIClientEvent(RTVIEvent.UserTranscript, useCallback((data: any) => {
    console.log("🎤 User transcription event:", JSON.stringify(data, null, 2));
    const transcriptText = data?.text || data?.data?.text || "";
    const isFinal = data?.final ?? data?.data?.final ?? false;
    const timestamp = data?.timestamp || data?.data?.timestamp || Date.now();
    
    console.log("Parsed transcript:", { transcriptText, isFinal, timestamp });

    // Only save final transcriptions to Supabase
    if (isFinal && transcriptText && transcriptText.trim()) {
      console.log("✅ Adding final user transcript:", transcriptText);
      const message: ChatMessage = {
        id: generateMessageId('user'),
        type: 'user',
        content: transcriptText.trim(),
        timestamp: new Date(timestamp)
      };
      
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      
      // Save to Supabase
      saveConversationDebounced(updatedMessages);
    }
  }, [messages, generateMessageId, saveConversationDebounced]));

  // Listen to bot transcription (LLM responses) (matching ChatConsole)
  useRTVIClientEvent(RTVIEvent.BotTranscript, useCallback((data: any) => {
    console.log("🤖 Bot transcription event:", JSON.stringify(data, null, 2));
    const transcriptText = data?.text || data?.data?.text || "";
    
    // Save all bot responses to Supabase
    if (transcriptText && transcriptText.trim()) {
      console.log("✅ Adding bot transcript:", transcriptText);
      const message: ChatMessage = {
        id: generateMessageId('bot'),
        type: 'bot',
        content: transcriptText.trim(),
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      
      // Save to Supabase
      saveConversationDebounced(updatedMessages);
    }
  }, [messages, generateMessageId, saveConversationDebounced]));

  // Listen to user speaking events
  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, useCallback(() => {
    console.log("🎙️ User started speaking");
    setIsListening(true);
  }, []));

  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, useCallback(() => {
    console.log("🔇 User stopped speaking");
    setIsListening(false);
  }, []));

  // Listen to bot speaking events
  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, useCallback(() => {
    console.log("🤖 Bot started speaking");
    setIsLoading(true);
  }, []));

  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, useCallback(() => {
    console.log("🤖 Bot stopped speaking");
    setIsLoading(false);
  }, []));

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

  // Update form value when messages change
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

  // Connection handlers (matching ChatConsole pattern)
  const handleConnectionToggle = async () => {
    console.log("🔘 Connect button clicked - Current state:", transportState);
    console.log("🔘 pipecatClient available:", !!pipecatClient);
    console.log("🔘 pipecatClient object:", pipecatClient);
    
    try {
      if (isConnected) {
        console.log("🔌 Attempting to disconnect...");
        await pipecatClient?.disconnect();
      } else {
        console.log("🔌 Attempting to connect...");
        setIsLoading(true);
        
        // Use the same endpoint and request data as your working components
        const endpoint = `${import.meta.env.VITE_PIPECAT_API_URL || "https://manjujayamurali--secondbrain-fastapi-app.modal.run/connect"}`;
        console.log("🔗 Connection endpoint:", endpoint);
        console.log("🔗 Environment variable VITE_PIPECAT_API_URL:", import.meta.env.VITE_PIPECAT_API_URL);
        
        const requestData = {
          services: {
            llm: "openai", 
            tts: "cartesia",
          },
        };
        console.log("📦 Request data:", JSON.stringify(requestData, null, 2));
        
        if (!pipecatClient) {
          console.error("❌ pipecatClient is null - cannot connect");
          setIsLoading(false);
          return;
        }
        
        console.log("🚀 Calling pipecatClient.connect...");
        const connectPromise = pipecatClient.connect({
          endpoint,
          requestData,
        });
        
        console.log("⏳ Connect promise created, awaiting result...");
        await connectPromise;
        
        console.log("✅ Connect request completed successfully");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Connection error details:", {
        message: error?.message,
        stack: error?.stack,
        error: error
      });
      setIsLoading(false);
    }
  };

  // Handle microphone toggle (matching VideoConsole pattern)
  const handleMicToggle = async () => {
    try {
      const newState = !isMicEnabled;
      await enableMic(newState);
      toast({
        title: newState ? "Microphone enabled" : "Microphone disabled",
        description: `Microphone is now ${newState ? "on" : "off"}.`,
      });
    } catch (error) {
      console.error("Microphone toggle error:", error);
      toast({
        title: "Microphone Error",
        description: "Failed to toggle microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Handle microphone device change
  const handleMicrophoneChange = async (deviceId: string) => {
    try {
      await updateMic(deviceId);
      toast({
        title: "Microphone switched",
        description: "Microphone device has been changed.",
      });
    } catch (error) {
      console.error("Failed to switch microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Failed to switch microphone device.",
        variant: "destructive",
      });
    }
  };

  // Send text message through RTVI (matching ChatConsole pattern)
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !isConnected || !pipecatClient) return;
    
    const messageText = inputMessage.trim();
    setInputMessage("");
    
    try {
      console.log("📤 Sending typed message to RTVI server:", messageText);
      
      // Send directly to RTVI server - let server manage context
      // RTVI server will handle the response, which will trigger BotTranscript event
      pipecatClient.appendToContext({
        role: "user",
        content: messageText,
        run_immediately: true
      }).catch(error => {
        console.error("❌ appendToContext failed:", error);
        const errorMessage: ChatMessage = {
          id: generateMessageId('error'),
          type: 'error',
          content: "Failed to send message. Please try again.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      });
      
    } catch (error) {
      console.error("❌ Failed to process message:", error);
      const errorMessage: ChatMessage = {
        id: generateMessageId('error'),
        type: 'error',
        content: "Failed to process message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputMessage, isConnected, pipecatClient, generateMessageId]);

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

  // Connection status functions (matching ChatConsole pattern)
  const getConnectionStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-yellow-500 animate-pulse';
    if (hasError) return 'bg-red-500 animate-pulse';
    if (isDisconnected) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getConnectionStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    if (hasError) return 'Error';
    if (isDisconnected) return 'Disconnected';
    return transportState || 'Unknown';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Card className="w-full h-[500px] flex flex-col border-gray-200">
        {/* Session Info Header with RTVI Status */}
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>Session: {sessionId.split('_').pop()?.slice(0, 8).toUpperCase()}</span>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
              <span>{getConnectionStatusText()}</span>
            </div>
            
            {/* Listening Indicator */}
            {isListening && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-600">
                <Mic className="w-3 h-3 mr-1" />
                Listening
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* User Status */}
            {user ? (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Authenticated</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-gray-400" />
                <span>Anonymous</span>
              </div>
            )}
            
            {/* Mic Status with Enhanced Info */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Mic className={`w-3 h-3 ${isMicEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isMicEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    {isMicEnabled ? 'Mic On' : 'Mic Off'}
                  </span>
                </div>
                {selectedMic && (
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400 max-w-20 truncate">
                      {selectedMic.label || 'Default'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length <= 1 ? (
              <div className="text-center text-gray-500 py-8">
                {isConnected ? (
                  <>
                    <p>Connected! Start speaking or type a message.</p>
                    <p className="text-sm mt-2">AI responses available via voice and text.</p>
                  </>
                ) : (
                  <>
                    <p>Connect for voice chat or type to continue</p>
                    <p className="text-sm">Enhanced AI conversation with voice capabilities</p>
                  </>
                )}
              </div>
            ) : (
              messages.map((message) => {
                const styling = getMessageStyling(message.type);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${styling.container}`}
                  >
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 ${styling.bubble} shadow-sm`}>
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
              })
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-600">{botName} is responding...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Voice Controls with Device Management */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex gap-2 justify-center items-center">
            <Button
              onClick={handleConnectionToggle}
              disabled={isConnecting}
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {transportState === "connecting" ? "Connecting..." : 
                   transportState === "initializing" ? "Initializing..." :
                   transportState === "initialized" ? "Initializing..." :
                   transportState === "authenticating" ? "Authenticating..." :
                   transportState === "authenticated" ? "Authenticating..." :
                   "Connecting..."}
                </>
              ) : isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Connect Voice
                </>
              )}
            </Button>
            
            {isConnected && (
              <>
                <Button
                  onClick={handleMicToggle}
                  variant={isMicEnabled ? "default" : "destructive"}
                  size="sm"
                  className="flex items-center gap-2"
                  title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {isMicEnabled ? (
                    <>
                      <Mic className="w-4 h-4" />
                      Mic On
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Mic Off
                    </>
                  )}
                </Button>

                {/* Microphone Device Selector */}
                {availableMics.length > 1 && (
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      title="Microphone settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    {/* Device Selection Dropdown */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto min-w-48 z-50">
                      <label className="text-xs font-medium text-gray-600 mb-2 block">
                        Select Microphone
                      </label>
                      <select 
                        value={selectedMic?.deviceId || ""} 
                        onChange={(e) => handleMicrophoneChange(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1"
                      >
                        {availableMics.map((mic) => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Device Status */}
          {isConnected && (
            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isMicEnabled ? 'Mic Active' : 'Mic Muted'}</span>
                </div>
                {selectedMic && (
                  <div className="flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    <span>{selectedMic.label || 'Default Mic'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type or speak your message..." : "Type your message..."}
              className="flex-1"
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
          
          {/* Status and Character Count */}
          <div className="text-xs text-gray-400 mt-2 flex justify-between">
            <span>
              {!isConnected ? (
                "Click 'Connect Voice' for voice chat"
              ) : isListening ? (
                "🎤 Voice detected - processing..."
              ) : isMicEnabled ? (
                "🎤 Voice enabled - speak naturally"
              ) : (
                "Voice connected - enable microphone to speak"
              )}
            </span>
            <div className="flex gap-2">
              <span>{inputMessage.length}/500 chars</span>
              <span>{messages.length} messages</span>
            </div>
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
          <div>Messages: {messages.length} | Transport: {transportState}</div>
          <div>User: {user ? user.email : 'Anonymous'} | Form ID: {formId || 'Not provided'}</div>
          <div>Voice: {isConnected ? 'Connected' : 'Disconnected'} | Mic: {isMicEnabled ? 'On' : 'Off'}</div>
          <div>PipecatClient: {pipecatClient ? 'Available' : 'Not Available'}</div>
          <div>isConnecting: {isConnecting ? 'Yes' : 'No'} | isLoading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Available Mics: {availableMics.length} | Selected: {selectedMic?.label || 'None'}</div>
        </div>
      )}
    </div>
  );
};