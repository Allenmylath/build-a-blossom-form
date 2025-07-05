
import { Eye } from 'lucide-react';

export const EmptyFormState = () => (
  <div className="text-center py-8 text-gray-500">
    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
    <p>No fields to preview</p>
    <p className="text-sm">Add some fields to see your form here</p>
  </div>
);
