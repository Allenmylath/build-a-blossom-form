import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CalendarConnectionProps {
  isConnected: boolean;
  calendarEmail?: string | null;
  onConnectionChange: (connected: boolean) => void;
  user: any;
}

interface CalendarIntegration {
  provider: 'google' | 'calendly';
  title: string;
  description: string;
  logo: string;
}

export const CalendarConnection = ({ isConnected, calendarEmail, onConnectionChange, user }: CalendarConnectionProps) => {
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'google' | 'calendly'>('google');

  const integrations: CalendarIntegration[] = [
    {
      provider: 'google',
      title: 'Google Calendar',
      description: 'Connect your Google Calendar to enable appointment booking',
      logo: 'https://developers.google.com/identity/images/g-logo.png'
    },
    {
      provider: 'calendly',
      title: 'Calendly',
      description: 'Connect your Calendly account for seamless scheduling',
      logo: '/lovable-uploads/fc819cd2-41b9-464b-975a-01ee9cb6307f.png'
    }
  ];

  const handleConnectCalendar = async (provider: 'google' | 'calendly') => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const functionName = provider === 'google' ? 'google-calendar-oauth' : 'calendly-oauth';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'auth', 
          user_id: user.id,
          app_origin: window.location.origin
        }
      });

      if (error) throw error;

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Calendar connection error:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect your ${provider === 'google' ? 'Google Calendar' : 'Calendly'}. Please try again.`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnectCalendar = async (provider: 'google' | 'calendly') => {
    if (!user?.id) return;
    
    try {
      const functionName = provider === 'google' ? 'google-calendar-oauth' : 'calendly-oauth';
      const { error } = await supabase.functions.invoke(functionName, {
        body: { action: 'disconnect', user_id: user.id }
      });

      if (error) throw error;

      onConnectionChange(false);
      toast({
        title: "Calendar Disconnected",
        description: `Your ${provider === 'google' ? 'Google Calendar' : 'Calendly'} has been disconnected.`,
      });
    } catch (error) {
      console.error('Calendar disconnection error:', error);
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect your ${provider === 'google' ? 'Google Calendar' : 'Calendly'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {integrations.map((integration) => (
        <Card key={integration.provider}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <img 
                src={integration.logo} 
                alt={`${integration.title} logo`}
                className="w-6 h-6"
              />
              {integration.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected && activeProvider === integration.provider ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{integration.title} connected successfully</span>
                  </div>
                  {calendarEmail && (
                    <p className="text-green-700 text-sm">
                      Connected as {calendarEmail}
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDisconnectCalendar(integration.provider)}
                  className="w-full"
                >
                  Disconnect {integration.title}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
                <Button 
                  onClick={() => handleConnectCalendar(integration.provider)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Connecting..." : `Connect ${integration.title}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground bg-muted border rounded-lg p-4">
            <h4 className="font-medium mb-2">How calendar integrations work:</h4>
            <ul className="space-y-1">
              <li>• Forms can include appointment booking fields</li>
              <li>• Users can select available time slots</li>
              <li>• Appointments are automatically added to your calendar</li>
              <li>• Email confirmations are sent to both parties</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};