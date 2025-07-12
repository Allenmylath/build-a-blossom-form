import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useCalendlyIntegration } from '@/hooks/useCalendlyIntegration';
import { useToast } from '@/hooks/use-toast';
import { CalendarConnection } from '@/components/CalendarConnection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, Zap, Shield } from 'lucide-react';

const Integrations: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const {
    isConnected: calendarConnected,
    calendarEmail,
    setIsConnected: setCalendarConnected
  } = useCalendarIntegration(user);
  
  const {
    isConnected: calendlyConnected,
    calendlyEmail,
    setIsConnected: setCalendlyConnected,
    refreshStatus: refreshCalendlyStatus
  } = useCalendlyIntegration(user);

  const handleOAuthCallback = async (code: string, state: string) => {
    // Handle OAuth callback logic here
    console.log('OAuth callback:', { code, state });
  };

  useEffect(() => {
    // Handle OAuth callbacks
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Extract actual user ID from state (remove timestamp if present)
    const actualUserId = state && state.includes('_') ? state.split('_')[0] : state;

    // Handle OAuth errors
    if (error) {
      toast({
        title: "OAuth Error",
        description: errorDescription || error,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    // Handle successful OAuth callback - use extracted user ID for comparison
    if (code && state && user?.id === actualUserId) {
      handleOAuthCallback(code, state);
    }

    // Check for connection success flags
    if (searchParams.get('calendar_connected') === 'true') {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected!",
      });
      setCalendarConnected(true);
      window.history.replaceState({}, '', '/integrations');
    }

    if (searchParams.get('calendly_connected') === 'true') {
      toast({
        title: "Calendly Connected",
        description: "Your Calendly account has been successfully connected!",
      });
      setCalendlyConnected(true);
      refreshCalendlyStatus();
      window.history.replaceState({}, '', '/integrations');
    }

    // Check for connection errors
    const calendarError = searchParams.get('calendar_error');
    if (calendarError) {
      toast({
        title: "Calendar Connection Failed",
        description: `Error: ${calendarError}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/integrations');
    }

    const calendlyErrorParam = searchParams.get('calendly_error');
    if (calendlyErrorParam) {
      toast({
        title: "Calendly Connection Failed",
        description: `Error: ${calendlyErrorParam}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, user?.id, setCalendarConnected, setCalendlyConnected, refreshCalendlyStatus, toast]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Please sign in to manage your integrations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        </div>
        <p className="text-muted-foreground">
          Connect your calendar and scheduling services to enable appointment booking in your forms.
        </p>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={calendarConnected ? "default" : "secondary"}>
                {calendarConnected ? "Connected" : "Not Connected"}
              </Badge>
              {calendarConnected && calendarEmail && (
                <span className="text-sm text-muted-foreground">{calendarEmail}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendly</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={calendlyConnected ? "default" : "secondary"}>
                {calendlyConnected ? "Connected" : "Not Connected"}
              </Badge>
              {calendlyConnected && calendlyEmail && (
                <span className="text-sm text-muted-foreground">{calendlyEmail}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Integration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your calendar services to enable appointment booking functionality in your forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarConnection
            isConnected={calendarConnected}
            calendarEmail={calendarEmail}
            onConnectionChange={setCalendarConnected}
            user={user}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • Your calendar credentials are stored securely and encrypted in our database.
            </p>
            <p>
              • We only access your calendar to create events when appointments are booked through your forms.
            </p>
            <p>
              • You can disconnect any integration at any time, which will immediately revoke access.
            </p>
            <p>
              • We never read, modify, or delete existing events in your calendar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;