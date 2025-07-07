
import { useState } from 'react';
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Trash2, Share, BarChart3, Calendar, TrendingUp, ExternalLink, Lock, Globe, FolderOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FormCardProps {
  form: SavedForm;
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
  onShowAnalytics: (form: SavedForm) => void;
  onUpdateForm?: (formId: string, updates: Partial<SavedForm>) => void;
}

export const FormCard = ({ 
  form, 
  onLoadForm, 
  onDeleteForm, 
  onDuplicateForm, 
  onShareForm, 
  onShowAnalytics,
  onUpdateForm 
}: FormCardProps) => {
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
    console.log('Share URL:', form.shareUrl);
    
    if (form.shareUrl) {
      navigator.clipboard.writeText(form.shareUrl);
      toast({
        title: "Share Link Generated",
        description: "Form share link has been copied to clipboard.",
      });
    } else {
      toast({
        title: "Error",
        description: "No share URL available for this form.",
        variant: "destructive",
      });
    }
  };

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
      await onUpdateForm(form.id, { isPublic: newPublicStatus });
      toast({
        title: newPublicStatus ? "Form Made Public" : "Form Made Private",
        description: newPublicStatus 
          ? "Your form is now publicly accessible via the share link." 
          : "Your form is now private and no longer publicly accessible.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update form visibility. Please try again.",
        variant: "destructive",
      });
    }
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

    if (form.shareUrl) {
      window.open(form.shareUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Cannot Open Form",
        description: "This form doesn't have a share URL. Please make it public first.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-purple-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-lg truncate">{form.name}</h3>
              {form.isPublic ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
            {form.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{form.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">{form.fields.length} fields</span>
            <span className="font-medium">{form.submissions.length} responses</span>
          </div>
        </div>

        {/* Public/Private Toggle */}
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
            />
            <span className="text-xs text-gray-500">Public</span>
          </div>
        </div>

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
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 hover:bg-blue-50"
                  title="Quick Stats"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Stats
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Quick Stats for "{form.name}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-purple-600">{form.submissions.length}</div>
                      <div className="text-sm text-gray-600">Total Submissions</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{form.fields.length}</div>
                      <div className="text-sm text-gray-600">Form Fields</div>
                    </Card>
                  </div>
                  {form.submissions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recent Submissions</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {form.submissions.slice(0, 5).map(submission => (
                          <div key={submission.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => onShowAnalytics(form)}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Full Analytics
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
      </div>
    </Card>
  );
};
