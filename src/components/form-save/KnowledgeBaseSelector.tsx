
import React, { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, MessageCircle, AlertCircle } from 'lucide-react';
import { KnowledgeBase } from '@/hooks/useKnowledgeBases';

interface KnowledgeBaseSelectorProps {
  knowledgeBases: KnowledgeBase[];
  loading: boolean;
  selectedKnowledgeBaseId: string;
  onKnowledgeBaseChange: (value: string) => void;
  hasChatField: boolean;
  showValidationError: boolean;
}

const KnowledgeBaseSelectorComponent = ({
  knowledgeBases,
  loading,
  selectedKnowledgeBaseId,
  onKnowledgeBaseChange,
  hasChatField,
  showValidationError
}: KnowledgeBaseSelectorProps) => {
  if (!hasChatField) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="knowledgeBase" className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-purple-600" />
        Knowledge Base (Required for Chat Forms)
      </Label>
      {loading ? (
        <div className="text-sm text-gray-500">Loading knowledge bases...</div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-sm text-red-600">
          No knowledge bases found. Please create one first.
        </div>
      ) : (
        <Select
          value={selectedKnowledgeBaseId}
          onValueChange={onKnowledgeBaseChange}
          required
        >
          <SelectTrigger className={!selectedKnowledgeBaseId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select a knowledge base" />
          </SelectTrigger>
          <SelectContent>
            {knowledgeBases.map((kb) => (
              <SelectItem key={kb.id} value={kb.id}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {kb.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showValidationError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 w-4" />
          Knowledge base is required for forms with chat fields
        </div>
      )}
      <p className="text-xs text-gray-500">
        Chat forms require a knowledge base for AI-powered responses
      </p>
    </div>
  );
};

export const KnowledgeBaseSelector = memo(KnowledgeBaseSelectorComponent);
