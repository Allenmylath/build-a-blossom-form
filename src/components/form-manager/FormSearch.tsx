
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FormSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const FormSearch = ({ searchTerm, onSearchChange }: FormSearchProps) => {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="Search forms..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 w-64"
      />
    </div>
  );
};
