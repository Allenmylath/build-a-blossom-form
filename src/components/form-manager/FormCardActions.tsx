import { Button } from '@/components/ui/button';
import { Copy, Share, TrendingUp, Trash2, ExternalLink, FolderOpen } from 'lucide-react';
import { SavedForm } from '@/types/form';
import { toast } from '@/hooks/use-toast';
import { FormCardStats } from './FormCardStats';

interface FormCardActionsProps {
  form: SavedForm;
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
  onShowAnalytics: (form: SavedForm) => void;
}

export const FormCardActions = ({ 
  form, 
  onLoadForm, 
  onDeleteForm, 
  onDuplicateForm, 
  onShareForm, 
  onShowAnalytics 
}: FormCardActionsProps) => {
  const handleDelete = () => {
    onDeleteForm(form.id);
    toast({
      title: "Form Deleted",
      description: "The form has been permanently deleted.",
    });
  };

  const handleDuplicate = () => {
    onDuplicateForm(form);
    toast({
      title: "Form Duplicated",
      description: `"${form.name}" has been duplicated successfully.`,
    });
  };

  const handleShare = () => {
    console.log('Sharing form:', form);
    
    // Generate URL based on current domain instead of stored shareUrl
    const currentDomain = window.location.origin;
    const shareUrl = `${currentDomain}/form/${form.id}`;
    
    console.log('Generated share URL:', shareUrl);
    
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Generated",
      description: "Form share link has been copied to clipboard.",
    });
  };

  const handleOpenInNewWindow = () => {
    if (!form.isPublic) {
      toast({
        title: "Form Not Public",
        description: "This form is not public yet. Please make it public first by using the toggle switch below.",
        variant: "destructive",
      });
      return;
    }

    // Generate URL based on current domain instead of stored shareUrl
    const currentDomain = window.location.origin;
    const shareUrl = `${currentDomain}/form/${form.id}`;
    
    console.log('Opening form in new window:', shareUrl);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleOpenInNewWindow}
          className={`flex-1 ${form.isPublic ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 hover:bg-gray-500'}`}
          disabled={!form.isPublic}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {form.isPublic ? 'Open Shared' : 'Not Public'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLoadForm(form)}
          className="flex-1"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDuplicate}
          className="flex-1 hover:bg-blue-50"
          title="Duplicate"
        >
          <Copy className="w-4 h-4 mr-1" />
          Copy
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          className="flex-1 hover:bg-green-50"
          title="Share"
        >
          <Share className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShowAnalytics(form)}
          className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          title="Analytics"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Analytics
        </Button>
        
        <FormCardStats form={form} onShowAnalytics={onShowAnalytics} />
      </div>

      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        className="w-full hover:bg-red-600"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Form
      </Button>
    </div>
  );
};