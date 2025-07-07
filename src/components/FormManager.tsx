
import { useState } from 'react';
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, FolderOpen, Copy, Trash2, Share, BarChart3, Search, Calendar, TrendingUp, ExternalLink, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FormAnalytics } from './FormAnalytics';

interface FormManagerProps {
  savedForms: SavedForm[];
  onLoadForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onShareForm: (form: SavedForm) => void;
}

export const FormManager = ({ 
  savedForms, 
  onLoadForm, 
  onDeleteForm, 
  onDuplicateForm,
  onShareForm 
}: FormManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<SavedForm | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<SavedForm | null>(null);

  const filteredForms = savedForms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (formId: string) => {
    onDeleteForm(formId);
    toast({
      title: "Form Deleted",
      description: "The form has been permanently deleted.",
    });
  };

  const handleDuplicate = (form: SavedForm) => {
    onDuplicateForm(form);
    toast({
      title: "Form Duplicated",
      description: `"${form.name}" has been duplicated successfully.`,
    });
  };

  const handleShare = (form: SavedForm) => {
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

  const handleOpenInNewWindow = (form: SavedForm) => {
    if (!form.isPublic) {
      toast({
        title: "Form Not Public",
        description: "This form is not public yet. Please make it public first by editing the form and enabling the 'Make Public' option.",
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

  if (showAnalytics) {
    return (
      <FormAnalytics 
        form={showAnalytics} 
        onClose={() => setShowAnalytics(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <FolderOpen className="w-6 h-6 mr-2 text-purple-600" />
          My Forms
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm ? 'No forms found' : 'No saved forms yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Create your first form to get started!'}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => (
            <Card key={form.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-purple-200">
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

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenInNewWindow(form)}
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
                      onClick={() => handleDuplicate(form)}
                      className="flex-1 hover:bg-blue-50"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(form)}
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
                      onClick={() => setShowAnalytics(form)}
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
                          onClick={() => setSelectedForm(form)}
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
                            <Button onClick={() => setShowAnalytics(form)}>
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
                    onClick={() => handleDelete(form.id)}
                    className="w-full hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Form
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
