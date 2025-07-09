
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, GripVertical, X } from 'lucide-react';
import { FormField } from '@/types/form';
import { useState } from 'react';

interface FieldListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onDeleteField: (fieldId: string) => void;
}

export const FieldList = ({ 
  fields, 
  selectedFieldId, 
  onSelectField, 
  onMoveField,
  onDeleteField 
}: FieldListProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedItem(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    const draggedFieldId = e.dataTransfer.getData('text/plain');
    
    if (draggedFieldId && draggedFieldId !== targetFieldId) {
      const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
      const targetIndex = fields.findIndex(f => f.id === targetFieldId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Determine if we need to move up or down
        const direction = draggedIndex < targetIndex ? 'down' : 'up';
        const steps = Math.abs(targetIndex - draggedIndex);
        
        // Perform multiple moves to reach the target position
        for (let i = 0; i < steps; i++) {
          onMoveField(draggedFieldId, direction);
        }
      }
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };
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
              draggable
              onDragStart={(e) => handleDragStart(e, field.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, field.id)}
              onDragEnd={handleDragEnd}
              className={`p-3 border rounded-lg cursor-pointer transition-all group ${
                selectedFieldId === field.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${
                draggedItem === field.id ? 'opacity-50' : ''
              }`}
              onClick={() => onSelectField(field.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-gray-400 mr-2 cursor-grab active:cursor-grabbing" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                    {field.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Required</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveField(field.id, 'up');
                      }}
                      title="Move up"
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
                      title="Move down"
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteField(field.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete field"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
