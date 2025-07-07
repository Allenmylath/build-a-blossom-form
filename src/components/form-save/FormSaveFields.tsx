
import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface FormSaveFieldsProps {
  formData: {
    name: string;
    description: string;
    isPublic: boolean;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const FormSaveFieldsComponent = ({ formData, onInputChange }: FormSaveFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Form Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="Enter form name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Enter form description (optional)"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="public"
          checked={formData.isPublic}
          onCheckedChange={(checked) => onInputChange('isPublic', checked)}
        />
        <Label htmlFor="public" className="text-sm">
          Make this form publicly accessible
        </Label>
      </div>
    </>
  );
};

export const FormSaveFields = memo(FormSaveFieldsComponent);
