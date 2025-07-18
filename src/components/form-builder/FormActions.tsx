
import { Button } from '@/components/ui/button';
import { Save, Plus, FolderOpen, Download, Upload } from 'lucide-react';

interface FormActionsProps {
  onSave: () => void;
  onNew: () => void;
  onExportImport: (action: 'export' | 'import') => void;
  hasFields: boolean;
}

export const FormActions = ({ onSave, onNew, onExportImport, hasFields }: FormActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button 
        onClick={onSave} 
        disabled={!hasFields}
        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Form
      </Button>
      <Button onClick={onNew} variant="outline" className="flex-1 sm:flex-none">
        <Plus className="w-4 h-4 mr-2" />
        New Form
      </Button>
      <Button 
        onClick={() => onExportImport('export')} 
        variant="outline" 
        disabled={!hasFields}
        className="flex-1 sm:flex-none"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button 
        onClick={() => onExportImport('import')} 
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
    </div>
  );
};
