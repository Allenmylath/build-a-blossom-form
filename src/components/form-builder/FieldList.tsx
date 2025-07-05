
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { FormField } from '@/types/form';

interface FieldListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
}

export const FieldList = ({ 
  fields, 
  selectedFieldId, 
  onSelectField, 
  onMoveField 
}: FieldListProps) => {
  return (
    <Card className="p-6 bg-white shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Form Fields ({fields.length})</h3>
      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No fields added yet</p>
          <p className="text-sm">Add your first field above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedFieldId === field.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectField(field.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{field.label}</span>
                  <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Required</span>
                  )}
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveField(field.id, 'up');
                      }}
                    >
                      ↑
                    </Button>
                  )}
                  {index < fields.length - 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveField(field.id, 'down');
                      }}
                    >
                      ↓
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
