
import { Switch } from '@/components/ui/switch';
import { Globe, Lock } from 'lucide-react';
import { SavedForm } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface FormCardVisibilityToggleProps {
  form: SavedForm;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
}

export const FormCardVisibilityToggle = ({ form, onUpdateForm }: FormCardVisibilityToggleProps) => {
  const handleTogglePublic = async () => {
    if (!onUpdateForm) {
      toast({
        title: "Edit Mode Required",
        description: "To change form visibility, please click 'Edit' to open the form in edit mode first.",
        variant: "destructive",
      });
      return;
    }

    const newPublicStatus = !form.isPublic;
    
    try {
      console.log('Updating form visibility:', { formId: form.id, newStatus: newPublicStatus });
      
      const updatedForm = await onUpdateForm(form.id, { isPublic: newPublicStatus });
      
      if (updatedForm) {
        toast({
          title: newPublicStatus ? "Form Made Public" : "Form Made Private",
          description: newPublicStatus 
            ? "Your form is now publicly accessible via the share link." 
            : "Your form is now private and no longer publicly accessible.",
        });
      } else {
        throw new Error('Failed to update form');
      }
    } catch (error) {
      console.error('Error updating form visibility:', error);
      toast({
        title: "Failed to Update Form Visibility",
        description: "Please try again. If the problem persists, try editing the form first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        {form.isPublic ? (
          <Globe className="w-4 h-4 text-green-600" />
        ) : (
          <Lock className="w-4 h-4 text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {form.isPublic ? 'Public Form' : 'Private Form'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Private</span>
        <Switch
          checked={form.isPublic}
          onCheckedChange={handleTogglePublic}
          disabled={!onUpdateForm}
        />
        <span className="text-xs text-gray-500">Public</span>
      </div>
    </div>
  );
};
