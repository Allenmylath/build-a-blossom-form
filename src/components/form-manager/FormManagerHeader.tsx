
import { FolderOpen } from 'lucide-react';
import { FormSearch } from './FormSearch';

interface FormManagerHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const FormManagerHeader = ({ searchTerm, onSearchChange }: FormManagerHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold flex items-center">
        <FolderOpen className="w-6 h-6 mr-2 text-purple-600" />
        My Forms
      </h2>
      <FormSearch searchTerm={searchTerm} onSearchChange={onSearchChange} />
    </div>
  );
};
