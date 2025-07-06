
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  token_count?: number;
  content?: string;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeBases = (user: User | null) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKnowledgeBases = async () => {
    if (!user) {
      setKnowledgeBases([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching knowledge bases:', error);
        toast({
          title: "Error",
          description: "Failed to load knowledge bases.",
          variant: "destructive",
        });
        return;
      }

      setKnowledgeBases(data || []);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge bases.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!user) return;

    try {
      // First get the knowledge base to get the file path
      const { data: kb, error: fetchError } = await supabase
        .from('knowledge_bases')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching knowledge base:', fetchError);
        toast({
          title: "Error",
          description: "Failed to delete knowledge base.",
          variant: "destructive",
        });
        return;
      }

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-bases')
        .remove([kb.file_path]);

      if (storageError) {
        console.error('Error deleting file:', storageError);
      }

      // Delete the database record
      const { error } = await supabase
        .from('knowledge_bases')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting knowledge base:', error);
        toast({
          title: "Error",
          description: "Failed to delete knowledge base.",
          variant: "destructive",
        });
        return;
      }

      setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));
      toast({
        title: "Success",
        description: "Knowledge base deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge base.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, [user]);

  return {
    knowledgeBases,
    loading,
    fetchKnowledgeBases,
    deleteKnowledgeBase,
  };
};
