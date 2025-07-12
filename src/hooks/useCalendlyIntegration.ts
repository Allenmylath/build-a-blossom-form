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
        setIsConnected(true);
        setCalendlyEmail(data.email);
        setCalendlyUserUri(data.user_uri);
      } else {
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

  useEffect(() => {
    checkIntegrationStatus();
  }, [user?.id]);

  const refreshStatus = () => {
    setLoading(true);
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
