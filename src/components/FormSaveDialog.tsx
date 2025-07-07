
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBases';
import { Database, MessageCircle, AlertCircle } from 'lucide-react';
import { FormField } from '@/types/form';

interface FormSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    description: string; 
    isPublic: boolean; 
    knowledgeBaseId?: string 
  }) => void;
  initialData?: {
    name: string;
    description: string;
    isPublic: boolean;
    knowledgeBaseId?: string;
  };
  fields?: FormField[];
}

export const FormSaveDialog = ({ isOpen, onClose, onSave, initialData, fields = [] }: FormSaveDialogProps) => {
  const { user } = useSupabaseAuth();
  const { knowledgeBases } = useKnowledgeBases(user);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    isPublic: initialData?.isPublic || false,
    knowledgeBaseId: initialData?.knowledgeBaseId || '',
  });

  // Check if form contains a chat field
  const hasChatField = fields.some(field => field.type === 'chat');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        isPublic: initialData.isPublic,
        knowledgeBaseId: initialData.knowledgeBaseId || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that knowledge base is selected if form has chat field
    if (hasChatField && !formData.knowledgeBaseId) {
      return; // Form validation will show the error
    }
    
    onSave({
      name: formData.name,
      description: formData.description,
      isPublic: formData.isPublic,
      knowledgeBaseId: formData.knowledgeBaseId || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isPublic: false,
      knowledgeBaseId: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Update Form' : 'Save Form'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Form Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter form name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter form description (optional)"
              rows={3}
            />
          </div>

          {hasChatField && (
            <div className="space-y-2">
              <Label htmlFor="knowledgeBase" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-600" />
                Knowledge Base (Required for Chat Forms)
              </Label>
              <Select
                value={formData.knowledgeBaseId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, knowledgeBaseId: value }))}
                required
              >
                <SelectTrigger className={!formData.knowledgeBaseId ? 'border-red-500' : ''}>
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
              {!formData.knowledgeBaseId && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  Knowledge base is required for forms with chat fields
                </div>
              )}
              <p className="text-xs text-gray-500">
                Chat forms require a knowledge base for AI-powered responses
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="public" className="text-sm">
              Make this form publicly accessible
            </Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={hasChatField && !formData.knowledgeBaseId}
            >
              {initialData ? 'Update' : 'Save'} Form
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
