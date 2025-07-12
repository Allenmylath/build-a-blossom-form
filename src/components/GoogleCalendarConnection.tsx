import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GoogleCalendarConnectionProps {
  isConnected: boolean;
  calendarEmail?: string | null;
  onConnectionChange: (connected: boolean) => void;
  user: any;
}

export const GoogleCalendarConnection = ({ isConnected, calendarEmail, onConnectionChange, user }: GoogleCalendarConnectionProps) => {
  const [loading, setLoading] = useState(false);

  const handleConnectCalendar = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
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
        description: "Failed to connect your Google Calendar. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'disconnect', user_id: user.id }
      });

      if (error) throw error;

      onConnectionChange(false);
      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    } catch (error) {
      console.error('Calendar disconnection error:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect your Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Google Calendar connected successfully</span>
          </div>
          {calendarEmail && (
            <p className="text-green-700 text-sm">
              Connected as {calendarEmail}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={handleDisconnectCalendar}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            'Disconnect Google Calendar'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your Google Calendar to enable appointment booking
      </p>
      <Button 
        onClick={handleConnectCalendar}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Google Calendar'
        )}
      </Button>
    </div>
  );
};