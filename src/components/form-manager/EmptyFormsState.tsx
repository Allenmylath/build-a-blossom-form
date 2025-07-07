
import { Card } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

interface EmptyFormsStateProps {
  searchTerm: string;
}

export const EmptyFormsState = ({ searchTerm }: EmptyFormsStateProps) => {
  return (
    <Card className="p-8 text-center">
      <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">
        {searchTerm ? 'No forms found' : 'No saved forms yet'}
      </h3>
      <p className="text-gray-500">
        {searchTerm ? 'Try adjusting your search terms.' : 'Create your first form to get started!'}
      </p>
    </Card>
  );
};
