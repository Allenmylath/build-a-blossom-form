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
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your calendar and scheduling services to enable appointment booking in your forms
          </p>
        </div>

        {/* Processing Alert */}
        {processing && (
          <Alert className="mb-8 border-blue-200 bg-blue-50/50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800">
              Processing your request...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {calendlyError && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {calendlyError}
            </AlertDescription>
          </Alert>
        )}

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Google Calendar Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Google Calendar</CardTitle>
                    <CardDescription className="text-sm">
                      Enable appointment booking
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={calendarConnected ? "default" : "secondary"}
                  className={cn(
                    calendarConnected 
                      ? "bg-green-100 text-green-700 border-green-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                >
                  {calendarConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              
              {calendarConnected && calendarEmail && (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">{calendarEmail}</span>
                </div>
              )}
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

          {/* Calendly Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <img 
                      src="/lovable-uploads/fc819cd2-41b9-464b-975a-01ee9cb6307f.png" 
                      alt="Calendly" 
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Calendly</CardTitle>
                    <CardDescription className="text-sm">
                      Embed scheduling links
                    </CardDescription>
                  </div>
                </div>
                {calendlyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                ) : (
                  <Badge 
                    variant={calendlyConnected ? "default" : "secondary"}
                    className={cn(
                      calendlyConnected 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    )}
                  >
                    {calendlyConnected ? "Connected" : "Not Connected"}
                  </Badge>
                )}
              </div>
              
              {calendlyConnected && calendlyEmail && (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">{calendlyEmail}</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {calendlyConnected ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ready to use in your forms
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleCalendlyDisconnect}
                      disabled={processing || calendlyLoading}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 border-2 border-dashed border-orange-300 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-orange-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect to embed scheduling links
                    </p>
                    <Button 
                      onClick={handleCalendlyConnect}
                      disabled={processing || calendlyLoading}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Integrations;