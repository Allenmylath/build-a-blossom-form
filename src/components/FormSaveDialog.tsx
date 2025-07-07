
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store';
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

const FormSaveDialogComponent = ({ isOpen, onClose, onSave, initialData, fields = [] }: FormSaveDialogProps) => {
  // Move ALL hooks to top before any conditionals
  const { user } = useAppStore();
  const { knowledgeBases, loading } = useKnowledgeBases(user);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    knowledgeBaseId: '',
  });

  // Memoize the chat field check to prevent recalculation
  const hasChatField = useMemo(() => {
    return fields.some(field => field.type === 'chat');
  }, [fields]);

  // Memoize initial data to prevent unnecessary effects
  const memoizedInitialData = useMemo(() => initialData, [
    initialData?.name,
    initialData?.description,
    initialData?.isPublic,
    initialData?.knowledgeBaseId
  ]);

  // Early return if dialog is not open - this prevents infinite renders
  if (!isOpen) {
    return null;
  }

  console.log('FormSaveDialog render:', {
    isOpen,
    hasChatField,
    knowledgeBases: knowledgeBases.length,
    selectedKnowledgeBaseId: formData.knowledgeBaseId,
    loading
  });

  // Only update form data when dialog opens and initialData is provided
  useEffect(() => {
    if (isOpen && memoizedInitialData) {
      setFormData({
        name: memoizedInitialData.name,
        description: memoizedInitialData.description,
        isPublic: memoizedInitialData.isPublic,
        knowledgeBaseId: memoizedInitialData.knowledgeBaseId || '',
      });
    }
  }, [isOpen, memoizedInitialData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that knowledge base is selected if form has chat field
    if (hasChatField && !formData.knowledgeBaseId) {
      console.error('Knowledge base is required for chat forms');
      return;
    }
    
    console.log('Submitting form data:', formData);
    
    onSave({
      name: formData.name,
      description: formData.description,
      isPublic: formData.isPublic,
      knowledgeBaseId: formData.knowledgeBaseId || undefined,
    });
  }, [formData, hasChatField, onSave]);

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      isPublic: false,
      knowledgeBaseId: '',
    });
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleKnowledgeBaseChange = useCallback((value: string) => {
    console.log('Knowledge base selected:', value);
    setFormData(prev => ({ ...prev, knowledgeBaseId: value }));
  }, []);

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
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter form name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
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
              {loading ? (
                <div className="text-sm text-gray-500">Loading knowledge bases...</div>
              ) : knowledgeBases.length === 0 ? (
                <div className="text-sm text-red-600">
                  No knowledge bases found. Please create one first.
                </div>
              ) : (
                <Select
                  value={formData.knowledgeBaseId}
                  onValueChange={handleKnowledgeBaseChange}
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
              )}
              {!formData.knowledgeBaseId && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 w-4" />
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
              onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
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

// Wrap with React.memo to prevent unnecessary re-renders
export const FormSaveDialog = memo(FormSaveDialogComponent);
