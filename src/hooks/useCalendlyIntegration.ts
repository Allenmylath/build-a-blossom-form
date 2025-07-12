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
      
      // Query the dedicated calendly_integrations table  
      const { data, error: dbError } = await supabase
        .from('calendly_integrations')
        .select('calendly_email, calendly_user_uri, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Database query error:', dbError);
        // Fall back to edge function if direct query fails
        return await checkStatusViaEdgeFunction();
      }

      if (data) {
        console.log('Found active Calendly integration');
        setIsConnected(true);
        setCalendlyEmail(data.calendly_email);
        setCalendlyUserUri(data.calendly_user_uri);
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

  const checkStatusViaEdgeFunction = async () => {
    try {
      console.log('Fallback: checking status via edge function');
      
      const { data, error: functionError } = await supabase.functions.invoke('calendly-oauth', {
        body: { 
          action: 'check_status', 
          user_id: user!.id 
        }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw functionError;
      }

      if (data?.connected) {
        setIsConnected(true);
        setCalendlyEmail(data.email);
        setCalendlyUserUri(data.user_uri);
      } else {
        setIsConnected(false);
        setCalendlyEmail(null);
        setCalendlyUserUri(null);
      }
    } catch (error) {
      console.error('Edge function status check failed:', error);
      // Don't throw here, just set error state
      setError('Failed to verify connection status');
    }
  };

  useEffect(() => {
    checkIntegrationStatus();
  }, [user?.id]);

  const refreshStatus = () => {
    setLoading(true);
    setError(null);
    checkIntegrationStatus();
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
    refreshStatus
  };
};