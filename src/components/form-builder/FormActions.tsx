
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
    <div className="flex space-x-2 mb-4">
      <Button 
        onClick={onSave} 
        className="flex items-center bg-green-600 hover:bg-green-700 text-white"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Form
      </Button>
      <Button onClick={onNew} variant="outline" className="flex items-center">
        <Plus className="w-4 h-4 mr-2" />
        New Form
      </Button>
      <Button 
        onClick={() => onExportImport('export')} 
        variant="outline" 
        disabled={!hasFields}
        className="flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button 
        onClick={() => onExportImport('import')} 
        variant="outline"
        className="flex items-center"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
    </div>
  );
};
