
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface ConversationalFormProps {
  websocketUrl?: string;
  botName?: string;
}

export const ConversationalForm = ({ 
  websocketUrl = 'ws://localhost:8080', 
  botName = 'Assistant' 
}: ConversationalFormProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(websocketUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Connected to the bot successfully!",
        });
        addBotMessage("Hello! I'm your AI assistant. You can type or speak to me.");
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addBotMessage(data.message || data.content || event.data);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Connection to bot lost. Attempting to reconnect...",
          variant: "destructive",
        });
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the bot server.",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      // Simulate bot for demo purposes when WebSocket fails
      setIsConnected(true);
      addBotMessage("Hello! I'm your AI assistant. (Demo mode - WebSocket connection failed)");
    }
  };

  const addMessage = (type: 'user' | 'bot', content: string, isVoice = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isVoice,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (content: string) => {
    addMessage('bot', content);
    if (speechEnabled) {
      speakText(content);
    }
  };

  const sendMessage = (message: string, isVoice = false) => {
    if (!message.trim()) return;

    addMessage('user', message, isVoice);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message,
        type: isVoice ? 'voice' : 'text',
        timestamp: new Date().toISOString(),
      }));
    } else {
      // Simulate bot response for demo
      setTimeout(() => {
        const responses = [
          "I understand you said: " + message,
          "That's interesting! Tell me more.",
          "I'm here to help. What else would you like to know?",
          "Thanks for sharing that with me!",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addBotMessage(randomResponse);
      }, 1000);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would typically send the audio to a speech-to-text service
        // For demo purposes, we'll simulate speech recognition
        simulateSpeechRecognition();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now... Click the mic button again to stop.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const simulateSpeechRecognition = () => {
    const speechResults = [
      "Hello, how are you today?",
      "Can you help me with my question?",
      "What can you do for me?",
      "I need some assistance please.",
    ];
    const randomSpeech = speechResults[Math.floor(Math.random() * speechResults.length)];
    sendMessage(randomSpeech, true);
  };

  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      stopSpeaking();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold">Conversational Form</h2>
              <p className="text-sm text-gray-600">Chat with {botName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSpeech}
              className={speechEnabled ? "text-green-600" : "text-gray-400"}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.type === 'user' ? 'You' : botName}
                  </span>
                  {message.isVoice && (
                    <Badge variant="secondary" className="text-xs">
                      Voice
                    </Badge>
                  )}
                  <span className="text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="bg-blue-100 text-blue-600 rounded-lg px-4 py-2">
                <span className="text-sm">🗣️ Speaking...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            className="px-4"
            disabled={!isConnected}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Type a message or click the microphone to speak. The bot will respond with both text and speech.
        </p>
      </div>
    </Card>
  );
};
