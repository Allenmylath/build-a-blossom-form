
import { Switch } from '@/components/ui/switch';
import { Globe, Lock, AlertCircle } from 'lucide-react';
import { SavedForm } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface FormCardVisibilityToggleProps {
  form: SavedForm;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => Promise<SavedForm | null>;
}

export const FormCardVisibilityToggle = ({ form, onUpdateForm }: FormCardVisibilityToggleProps) => {
  // Check if form has chat field
  const hasChatField = form.fields.some(field => field.type === 'chat');
  
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
    
    // Special validation for chat forms when making them public
    if (newPublicStatus && hasChatField && !form.knowledgeBaseId) {
      toast({
        title: "Knowledge Base Required",
        description: "Chat-enabled forms require a knowledge base to be made public. Please edit the form and select a knowledge base first.",
        variant: "destructive",
      });
      return;
    }
    
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
      
      // More specific error message for chat forms
      if (hasChatField && !form.knowledgeBaseId) {
        toast({
          title: "Cannot Update Chat Form",
          description: "This chat form needs a knowledge base. Please edit the form and add a knowledge base first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Update Form Visibility",
          description: "Please try again. If the problem persists, try editing the form first.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
      
      {hasChatField && !form.knowledgeBaseId && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Chat forms require a knowledge base to be made public</span>
        </div>
      )}
    </div>
  );
};
