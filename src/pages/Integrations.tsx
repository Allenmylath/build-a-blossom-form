import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useCalendlyIntegration } from '@/hooks/useCalendlyIntegration';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarConnection } from '@/components/GoogleCalendarConnection';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        
        {/* Modern Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-4 shadow-lg border border-gray-100">
              <Settings className="h-8 w-8 text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
            Integrations Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Seamlessly connect your essential tools and unlock powerful automation capabilities
          </p>
        </div>

        {/* Alerts Section */}
        <div className="space-y-4 mb-12">
          {processing && (
            <Alert className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25"></div>
                </div>
                <AlertDescription className="text-blue-800 font-medium">
                  Processing your request...
                </AlertDescription>
              </div>
            </Alert>
          )}

          {calendlyError && (
            <Alert variant="destructive" className="border-0 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">
                {calendlyError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Integration Cards - New Design */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Google Calendar - Redesigned */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <Card className="relative bg-white border-0 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
              
              {/* Header with Glass Effect */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-8 text-white">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Google Calendar</h3>
                      <p className="text-blue-100 text-sm">Advanced scheduling & booking</p>
                    </div>
                  </div>
                  <Badge 
                    className={cn(
                      "px-4 py-2 text-sm font-semibold backdrop-blur-sm border",
                      calendarConnected 
                        ? "bg-emerald-500/90 text-white border-emerald-400/50" 
                        : "bg-white/20 text-white border-white/30"
                    )}
                  >
                    {calendarConnected ? "✓ Active" : "Inactive"}
                  </Badge>
                </div>
                
                {calendarConnected && calendarEmail && (
                  <div className="relative mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-white font-medium">{calendarEmail}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <CardContent className="p-8 bg-gradient-to-b from-white to-gray-50">
                {calendarConnected ? (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                      <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                        <Zap className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Integration Active</h4>
                      <p className="text-gray-600 mb-6">Your Google Calendar is connected and ready for appointment booking</p>
                      <GoogleCalendarConnection
                        isConnected={calendarConnected}
                        calendarEmail={calendarEmail}
                        onConnectionChange={setCalendarConnected}
                        user={user}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20"></div>
                      <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to Connect</h4>
                      <p className="text-gray-600 mb-6">Connect your Google Calendar to enable appointment booking in your forms</p>
                      <GoogleCalendarConnection
                        isConnected={calendarConnected}
                        calendarEmail={calendarEmail}
                        onConnectionChange={setCalendarConnected}
                        user={user}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendly - Redesigned */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <Card className="relative bg-white border-0 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
              
              {/* Header with Glass Effect */}
              <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-white">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                      <img 
                        src="/lovable-uploads/fc819cd2-41b9-464b-975a-01ee9cb6307f.png" 
                        alt="Calendly" 
                        className="h-8 w-8 brightness-0 invert"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Calendly</h3>
                      <p className="text-orange-100 text-sm">Smart link scheduling</p>
                    </div>
                  </div>
                  {calendlyLoading ? (
                    <div className="relative">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                      <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
                    </div>
                  ) : (
                    <Badge 
                      className={cn(
                        "px-4 py-2 text-sm font-semibold backdrop-blur-sm border",
                        calendlyConnected 
                          ? "bg-emerald-500/90 text-white border-emerald-400/50" 
                          : "bg-white/20 text-white border-white/30"
                      )}
                    >
                      {calendlyConnected ? "✓ Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                
                {calendlyConnected && calendlyEmail && (
                  <div className="relative mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-white font-medium">{calendlyEmail}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <CardContent className="p-8 bg-gradient-to-b from-white to-gray-50">
                {calendlyConnected ? (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                      <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                        <Zap className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Integration Active</h4>
                      <p className="text-gray-600 mb-6">Your Calendly account is connected and optimized for peak performance</p>
                      <Button 
                        variant="outline" 
                        onClick={handleCalendlyDisconnect}
                        disabled={processing || calendlyLoading}
                        className="px-8 py-3 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          'Disconnect Service'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-20"></div>
                      <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
                        <Zap className="h-10 w-10 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to Connect</h4>
                      <p className="text-gray-600 mb-6">Unlock powerful scheduling capabilities by connecting your Calendly account</p>
                      <Button 
                        onClick={handleCalendlyConnect}
                        disabled={processing || calendlyLoading}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
    </div>
  );
};

export default Integrations;