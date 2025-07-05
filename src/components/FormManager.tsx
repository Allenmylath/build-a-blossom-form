import { useState } from 'react';
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, FolderOpen, Copy, Trash2, Share, BarChart3, Search, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
            <Card key={form.id} className="p-4 hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                  {form.isPublic && <Badge variant="secondary">Public</Badge>}
                </div>

                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(form.updatedAt).toLocaleDateString()}
                  </span>
                  <span>{form.fields.length} fields</span>
                  <span>{form.submissions.length} submissions</span>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onLoadForm(form)}
                    className="flex-1"
                  >
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(form)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(form)}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedForm(form)}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Analytics for "{form.name}"</DialogTitle>
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
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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
