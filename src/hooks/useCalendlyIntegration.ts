import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useCalendlyIntegration = (user: User | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendlyEmail, setCalendlyEmail] = useState<string | null>(null);
  const [calendlyUserUri, setCalendlyUserUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkIntegrationStatus = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      console.log('Checking Calendly integration status for user:', user.id);
      
      // Call the edge function to check status
      const { data, error: functionError } = await supabase.functions.invoke('calendly-oauth', {
        body: { 
          action: 'check_status', 
          user_id: user.id 
        }
      });

      if (functionError) {
        console.error('Error checking Calendly integration:', functionError);
        setError(functionError.message);
        setIsConnected(false);
        setCalendlyEmail(null);
        setCalendlyUserUri(null);
        return;
      }

      if (data?.connected) {
        console.log('Found active Calendly integration:', data);
        setIsConnected(true);
        setCalendlyEmail(data.email);
        setCalendlyUserUri(data.user_uri);
      } else {
        console.log('No active Calendly integration found');
        setIsConnected(false);
        setCalendlyEmail(null);
        setCalendlyUserUri(null);
      }

    } catch (error) {
      console.error('Error checking Calendly integration:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnected(false);
      setCalendlyEmail(null);
      setCalendlyUserUri(null);
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Initiating Calendly connection...');
      
      const { data, error: functionError } = await supabase.functions.invoke('calendly-oauth', {
        body: { 
          action: 'auth', 
          user_id: user.id,
          app_origin: window.location.origin
        }
      });

      if (functionError) {
        console.error('Auth initiation error:', functionError);
        throw functionError;
      }

      if (data?.authUrl) {
        console.log('Redirecting to Calendly OAuth...');
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Failed to initiate Calendly connection:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string, state: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Handling OAuth callback...');
      
      const { data, error: functionError } = await supabase.functions.invoke('calendly-oauth', {
        body: { 
          action: 'callback', 
          user_id: user.id,
          code,
          state,
          app_origin: window.location.origin
        }
      });

      if (functionError) {
        console.error('Callback handling error:', functionError);
        throw functionError;
      }

      if (data?.success) {
        console.log('OAuth callback successful');
        await refreshStatus(); // Refresh the status after successful callback
        return data;
      } else {
        throw new Error(data?.error || 'Callback failed');
      }
    } catch (error) {
      console.error('Failed to handle OAuth callback:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Disconnecting Calendly integration...');
      
      const { data, error: functionError } = await supabase.functions.invoke('calendly-oauth', {
        body: { 
          action: 'disconnect', 
          user_id: user.id
        }
      });

      if (functionError) {
        console.error('Disconnect error:', functionError);
        throw functionError;
      }

      if (data?.success) {
        console.log('Calendly integration disconnected successfully');
        setIsConnected(false);
        setCalendlyEmail(null);
        setCalendlyUserUri(null);
      } else {
        throw new Error(data?.error || 'Disconnect failed');
      }
    } catch (error) {
      console.error('Failed to disconnect Calendly integration:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkIntegrationStatus();
  }, [user?.id]);

  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    await checkIntegrationStatus();
  };

  return {
    isConnected,
    calendlyEmail,
    calendlyUserUri,
    loading,
    error,
    setIsConnected,
    setCalendlyEmail,
    setCalendlyUserUri,
    refreshStatus,
    initiateConnection,
    handleCallback,
    disconnect
  };
};