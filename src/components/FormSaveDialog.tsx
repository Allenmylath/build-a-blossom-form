
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';

interface FormSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: { name: string; description: string; isPublic: boolean }) => void;
  initialData?: {
    name: string;
    description: string;
    isPublic: boolean;
  };
}

export const FormSaveDialog = ({ isOpen, onClose, onSave, initialData }: FormSaveDialogProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      isPublic
    });
    
    if (!initialData) {
      setName('');
      setDescription('');
      setIsPublic(false);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Save className="w-5 h-5 mr-2 text-purple-600" />
            {initialData ? 'Update Form' : 'Save Form'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="form-name">Form Name *</Label>
            <Input
              id="form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter form name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this form"
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public-form"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public-form">Make this form publicly accessible</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {initialData ? 'Update' : 'Save'} Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
