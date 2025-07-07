
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import { SavedForm } from '@/types/form';

interface FormCardStatsProps {
  form: SavedForm;
  onShowAnalytics: (form: SavedForm) => void;
}

export const FormCardStats = ({ form, onShowAnalytics }: FormCardStatsProps) => {
  return (
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
  );
};
