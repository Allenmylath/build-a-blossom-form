import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export interface ChatFlow {
  id: string;
  name: string;
  description?: string;
  flow_data: any;
  created_at: string;
  updated_at: string;
}

export const useChatFlows = (user: User | null) => {
  const [chatFlows, setChatFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChatFlows = async () => {
    if (!user) {
      setChatFlows([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chat flows:', error);
        toast({
          title: "Error",
          description: "Failed to load chat flows.",
          variant: "destructive",
        });
        return;
      }

      setChatFlows(data || []);
    } catch (error) {
      console.error('Error fetching chat flows:', error);
      toast({
        title: "Error",
        description: "Failed to load chat flows.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveChatFlow = async (flowData: {
    name: string;
    description?: string;
    flow_data: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_flows')
        .insert({
          user_id: user.id,
          name: flowData.name,
          description: flowData.description,
          flow_data: flowData.flow_data,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving chat flow:', error);
        toast({
          title: "Error",
          description: "Failed to save chat flow.",
          variant: "destructive",
        });
        return null;
      }

      setChatFlows(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Chat flow saved successfully.",
      });
      return data;
    } catch (error) {
      console.error('Error saving chat flow:', error);
      toast({
        title: "Error",
        description: "Failed to save chat flow.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateChatFlow = async (id: string, updates: {
    name?: string;
    description?: string;
    flow_data?: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_flows')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat flow:', error);
        toast({
          title: "Error",
          description: "Failed to update chat flow.",
          variant: "destructive",
        });
        return null;
      }

      setChatFlows(prev => prev.map(flow => 
        flow.id === id ? { ...flow, ...data } : flow
      ));
      toast({
        title: "Success",
        description: "Chat flow updated successfully.",
      });
      return data;
    } catch (error) {
      console.error('Error updating chat flow:', error);
      toast({
        title: "Error",
        description: "Failed to update chat flow.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteChatFlow = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_flows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting chat flow:', error);
        toast({
          title: "Error",
          description: "Failed to delete chat flow.",
          variant: "destructive",
        });
        return;
      }

      setChatFlows(prev => prev.filter(flow => flow.id !== id));
      toast({
        title: "Success",
        description: "Chat flow deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting chat flow:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat flow.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchChatFlows();
  }, [user]);

  return {
    chatFlows,
    loading,
    fetchChatFlows,
    saveChatFlow,
    updateChatFlow,
    deleteChatFlow,
  };
};