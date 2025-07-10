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

export const CalendarConnection = ({ isConnected, calendarEmail, onConnectionChange, user }: CalendarConnectionProps) => {
  const [loading, setLoading] = useState(false);

  const handleConnectCalendar = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'auth', user_id: user.id }
      });

      if (error) throw error;

      // Redirect to Google OAuth
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Calendar connected successfully</span>
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
              className="w-full"
            >
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to enable appointment booking functionality. 
              This will allow users to schedule meetings directly through your forms.
            </p>
            <Button 
              onClick={handleConnectCalendar}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground bg-muted border rounded-lg p-4 mt-4">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ul className="space-y-1">
            <li>• Forms can include appointment booking fields</li>
            <li>• Users can select available time slots</li>
            <li>• Appointments are automatically added to your calendar</li>
            <li>• Email confirmations are sent to both parties</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};