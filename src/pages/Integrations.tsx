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
import { Calendar, Settings, Zap, Shield, Loader2, AlertCircle, CheckCircle, Link } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-6 py-24 max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in Required</h3>
              <p className="text-gray-600">Please sign in to manage your integrations and connect your accounts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        
        {/* Clean Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <Settings className="h-8 w-8 text-gray-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Integrations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your tools to unlock powerful automation and streamline your workflow
          </p>
        </div>

        {/* Status Alerts */}
        {processing && (
          <div className="mb-8">
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-800 font-medium">
                Processing your request...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {calendlyError && (
          <div className="mb-8">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">
                {calendlyError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Integration Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Google Calendar Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-500"></div>
            <Card className="relative bg-white border-2 border-blue-100 hover:border-blue-300 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 rounded-3xl overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700"></div>
              
              <CardHeader className="relative pb-6 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Calendar className="h-8 w-8 text-white" />
                      <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">Google Calendar</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">Schedule appointments and manage bookings</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {calendarConnected ? (
                      <Badge className="bg-green-500 text-white hover:bg-green-500 border-0 shadow-lg animate-pulse px-4 py-2 rounded-2xl">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-300 bg-white/70 px-4 py-2 rounded-2xl">
                        <Link className="h-4 w-4 mr-2" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-6 p-8 pt-0">
                {calendarConnected && calendarEmail && (
                  <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-sm font-semibold text-green-800">{calendarEmail}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 group/item hover:bg-blue-50/50 p-3 rounded-2xl transition-colors duration-200">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200 shadow-md"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-blue-900 transition-colors duration-200 font-medium">Enable appointment booking in your forms</p>
                  </div>
                  <div className="flex items-start space-x-4 group/item hover:bg-blue-50/50 p-3 rounded-2xl transition-colors duration-200">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200 shadow-md"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-blue-900 transition-colors duration-200 font-medium">Automatic calendar synchronization</p>
                  </div>
                  <div className="flex items-start space-x-4 group/item hover:bg-blue-50/50 p-3 rounded-2xl transition-colors duration-200">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200 shadow-md"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-blue-900 transition-colors duration-200 font-medium">Real-time availability checking</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <GoogleCalendarConnection
                    isConnected={calendarConnected}
                    calendarEmail={calendarEmail}
                    onConnectionChange={setCalendarConnected}
                    user={user}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendly Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-500"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border border-orange-100 hover:border-orange-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/30"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700"></div>
              
              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <img 
                        src="/lovable-uploads/fc819cd2-41b9-464b-975a-01ee9cb6307f.png" 
                        alt="Calendly" 
                        className="h-7 w-7 brightness-0 invert"
                      />
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-900 transition-colors duration-300">Calendly</CardTitle>
                      <CardDescription className="text-gray-600">Smart scheduling with booking links</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {calendlyLoading ? (
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                      </div>
                    ) : calendlyConnected ? (
                      <Badge className="bg-green-500 text-white hover:bg-green-500 border-0 shadow-lg animate-pulse">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-300 bg-white/50">
                        <Link className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                {calendlyConnected && calendlyEmail && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-sm font-medium text-green-800">{calendlyEmail}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 group/item hover:bg-orange-50/50 p-2 rounded-lg transition-colors duration-200">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-orange-900 transition-colors duration-200">Automated scheduling workflows</p>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-orange-50/50 p-2 rounded-lg transition-colors duration-200">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-orange-900 transition-colors duration-200">Custom booking preferences</p>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-orange-50/50 p-2 rounded-lg transition-colors duration-200">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 group-hover/item:scale-125 transition-transform duration-200"></div>
                    <p className="text-sm text-gray-700 group-hover/item:text-orange-900 transition-colors duration-200">Integration with your existing calendar</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  {calendlyConnected ? (
                    <Button 
                      variant="outline" 
                      onClick={handleCalendlyDisconnect}
                      disabled={processing || calendlyLoading}
                      className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:shadow-lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        'Disconnect Calendly'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCalendlyConnect}
                      disabled={processing || calendlyLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
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
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Need help setting up integrations? Check our documentation or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;