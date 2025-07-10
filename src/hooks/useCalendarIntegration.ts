import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useCalendarIntegration = (user: User | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCalendarIntegration = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('calendar_integrations')
          .select('is_active, calendar_email')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking calendar integration:', error);
        }

        if (data) {
          setIsConnected(true);
          setCalendarEmail(data.calendar_email);
        } else {
          setIsConnected(false);
          setCalendarEmail(null);
        }
      } catch (error) {
        console.error('Error checking calendar integration:', error);
        setIsConnected(false);
        setCalendarEmail(null);
      } finally {
        setLoading(false);
      }
    };

    checkCalendarIntegration();
  }, [user?.id]);

  return {
    isConnected,
    calendarEmail,
    loading,
    setIsConnected,
    setCalendarEmail
  };
};