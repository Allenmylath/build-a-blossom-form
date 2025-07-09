import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit2, MessageSquare, Save, X, Trash2, GripVertical } from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'question';
  prompt: string;
  field: string;
  label: string;
  hook: string;
}

interface LinearFlowNodeProps {
  node: FlowNode;
  index: number;
  onUpdate: (id: string, updates: Partial<FlowNode>) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}

export const LinearFlowNode = ({
  node,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: LinearFlowNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    prompt: node.prompt,
    field: node.field,
    label: node.label,
  });

  const handleSave = () => {
    onUpdate(node.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      prompt: node.prompt,
      field: node.field,
      label: node.label,
    });
    setIsEditing(false);
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      onRemove(node.id);
    }
  };

  return (
    <Card 
      className={`relative transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-move">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Step Number */}
      <div className="absolute -left-3 top-4">
        <Badge variant="outline" className="bg-background">
          {index + 1}
        </Badge>
      </div>

      <CardHeader className="pb-3 pl-8">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {node.label}
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 pl-8">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`label-${node.id}`} className="text-xs">Question Label</Label>
              <Input
                id={`label-${node.id}`}
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                className="text-xs"
                placeholder="e.g., Name Question"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`prompt-${node.id}`} className="text-xs">Question Prompt</Label>
              <Textarea
                id={`prompt-${node.id}`}
                value={editData.prompt}
                onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                className="text-xs resize-none"
                rows={2}
                placeholder="What question will the chat ask?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`field-${node.id}`} className="text-xs">Field Name</Label>
              <Input
                id={`field-${node.id}`}
                value={editData.field}
                onChange={(e) => setEditData({ ...editData, field: e.target.value })}
                className="text-xs"
                placeholder="e.g., name, email, phone"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="flex-1"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Question:</div>
              <div className="text-sm bg-muted p-2 rounded">{node.prompt}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Saves to field:</div>
              <div className="text-xs bg-muted p-2 rounded font-mono">{node.field}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};