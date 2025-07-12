import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useCalendlyIntegration } from '@/hooks/useCalendlyIntegration';
import { useToast } from '@/hooks/use-toast';
import { CalendarConnection } from '@/components/CalendarConnection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, Zap, Shield, Loader2, AlertCircle } from 'lucide-react';

const Integrations: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  
  // Prevent duplicate OAuth callback processing
  const callbackProcessed = useRef(false);
  const currentCallbackId = useRef<string | null>(null);
  
  const {
    isConnected: calendarConnected,
    calendarEmail,
    setIsConnected: setCalendarConnected
  } = useCalendarIntegration(user);
  
  const {
    isConnected: calendlyConnected,
    calendlyEmail,
    setIsConnected: setCalendlyConnected,
    refreshStatus: refreshCalendlyStatus,
    initiateConnection: initiateCalendlyConnection,
    handleCallback: handleCalendlyCallback,
    disconnect: disconnectCalendly,
    loading: calendlyLoading,
    error: calendlyError
  } = useCalendlyIntegration(user);

  const handleOAuthCallback = async (code: string, state: string) => {
    // Create unique identifier for this callback
    const callbackId = `${code.substring(0, 8)}_${state.substring(0, 8)}`;
    
    // Prevent duplicate processing of the same callback
    if (currentCallbackId.current === callbackId) {
      console.log('Callback already processed for this code/state combination');
      return;
    }
    
    if (!user?.id) {
      console.error('No user ID available for callback');
      toast({
        title: "Authentication Error",
        description: "No user session found. Please sign in and try again.",
        variant: "destructive",
      });
      return;
    }

    // Extract actual user ID from state (remove timestamp if present)
    const actualUserId = state && state.includes('_') ? state.split('_')[0] : state;

    // Verify that the state matches the current user
    if (actualUserId !== user.id) {
      console.error('State user ID mismatch:', { actualUserId, currentUserId: user.id });
      toast({
        title: "Authentication Error",
        description: "Invalid authentication state. Please try again.",
        variant: "destructive",
      });
      // Clean up URL even on error
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    try {
      // Mark this callback as being processed
      currentCallbackId.current = callbackId;
      setProcessing(true);
      
      console.log('Processing OAuth callback...', { code: code.substring(0, 8) + '...', state });
      
      const result = await handleCalendlyCallback(code, state);
      
      if (result?.success) {
        toast({
          title: "Calendly Connected",
          description: "Your Calendly account has been successfully connected!",
        });
        setCalendlyConnected(true);
        
        // Clean up URL parameters after successful connection
        window.history.replaceState({}, '', '/integrations');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to connect Calendly";
      if (error instanceof Error) {
        if (error.message.includes('expired') || error.message.includes('already used')) {
          errorMessage = "Authorization expired. Please try connecting again.";
        } else if (error.message.includes('invalid_grant')) {
          errorMessage = "Invalid authorization. Please start the connection process again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up URL parameters even on error
      window.history.replaceState({}, '', '/integrations');
    } finally {
      setProcessing(false);
      // Reset callback tracking after processing
      setTimeout(() => {
        currentCallbackId.current = null;
      }, 1000);
    }
  };

  const handleCalendlyConnect = async () => {
    try {
      setProcessing(true);
      console.log('Initiating Calendly connection...');
      await initiateCalendlyConnection();
    } catch (error) {
      console.error('Calendly connection error:', error);
      
      let errorMessage = "Failed to start Calendly connection";
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = "Please sign in first";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleCalendlyDisconnect = async () => {
    try {
      setProcessing(true);
      await disconnectCalendly();
      toast({
        title: "Calendly Disconnected",
        description: "Your Calendly account has been disconnected.",
      });
    } catch (error) {
      console.error('Calendly disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect Calendly",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    // Prevent multiple runs of the same callback processing
    if (callbackProcessed.current) {
      return;
    }

    // Handle OAuth callbacks
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors first
    if (error) {
      console.error('OAuth error received:', { error, errorDescription });
      toast({
        title: "OAuth Error",
        description: errorDescription || error,
        variant: "destructive",
      });
      // Mark as processed and clear URL
      callbackProcessed.current = true;
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    // Handle successful OAuth callback
    if (code && state && user?.id && !processing) {
      console.log('OAuth callback detected, processing...', { 
        hasCode: !!code, 
        hasState: !!state, 
        hasUser: !!user?.id,
        processing 
      });
      
      callbackProcessed.current = true; // Mark as processed immediately
      handleOAuthCallback(code, state);
      return;
    }

    // Handle legacy URL parameters for backward compatibility
    if (searchParams.get('calendar_connected') === 'true') {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected!",
      });
      setCalendarConnected(true);
      callbackProcessed.current = true;
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    if (searchParams.get('calendly_connected') === 'true') {
      toast({
        title: "Calendly Connected",
        description: "Your Calendly account has been successfully connected!",
      });
      setCalendlyConnected(true);
      refreshCalendlyStatus();
      callbackProcessed.current = true;
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    // Handle connection errors
    const calendarError = searchParams.get('calendar_error');
    if (calendarError) {
      toast({
        title: "Calendar Connection Failed",
        description: `Error: ${calendarError}`,
        variant: "destructive",
      });
      callbackProcessed.current = true;
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    const calendlyErrorParam = searchParams.get('calendly_error');
    if (calendlyErrorParam) {
      toast({
        title: "Calendly Connection Failed",
        description: `Error: ${calendlyErrorParam}`,
        variant: "destructive",
      });
      callbackProcessed.current = true;
      window.history.replaceState({}, '', '/integrations');
      return;
    }

  }, [searchParams, user?.id, processing]);

  // Reset callback processed flag when user changes or when navigating away from callback
  useEffect(() => {
    const hasCallbackParams = searchParams.has('code') || searchParams.has('state') || 
                              searchParams.has('error') || searchParams.has('calendar_connected') || 
                              searchParams.has('calendly_connected');
    
    if (!hasCallbackParams) {
      callbackProcessed.current = false;
      currentCallbackId.current = null;
    }
  }, [searchParams]);

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

      {/* Processing Alert */}
      {processing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing your request...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {calendlyError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {calendlyError}
          </AlertDescription>
        </Alert>
      )}

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
              {calendlyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Badge variant={calendlyConnected ? "default" : "secondary"}>
                  {calendlyConnected ? "Connected" : "Not Connected"}
                </Badge>
              )}
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
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to enable appointment booking functionality in your forms.
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

      {/* Calendly Integration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Calendly Integration
          </CardTitle>
          <CardDescription>
            Connect your Calendly account to embed scheduling links in your forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calendlyConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Connected to Calendly</p>
                      {calendlyEmail && (
                        <p className="text-sm text-muted-foreground">{calendlyEmail}</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleCalendlyDisconnect}
                    disabled={processing || calendlyLoading}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Calendly account is connected and ready to use in your forms. You can now add Calendly scheduling links to your form fields.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="font-medium">Connect your Calendly account</p>
                      <p className="text-sm text-muted-foreground">
                        Allow access to embed scheduling links in your forms
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCalendlyConnect}
                    disabled={processing || calendlyLoading}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Calendly'
                    )}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    • Access your Calendly event types and scheduling links
                  </p>
                  <p>
                    • Embed scheduling functionality directly in your forms
                  </p>
                  <p>
                    • Allow form respondents to book appointments seamlessly
                  </p>
                </div>
              </div>
            )}
          </div>
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
              • For Calendly, we only access your scheduling links and event types - we never modify your settings.
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