import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    prompt: node.prompt,
    field: node.field,
    label: node.label,
  });

  const handleSave = () => {
    onUpdate(node.id, editData);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setEditData({
      prompt: node.prompt,
      field: node.field,
      label: node.label,
    });
    setIsDialogOpen(false);
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      onRemove(node.id);
    }
  };

  return (
    <div className="relative">
      {/* Step Number */}
      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-10">
        <Badge variant="outline" className="bg-background">
          {index + 1}
        </Badge>
      </div>

      <Card 
        className={`relative transition-all duration-200 cursor-move hover:shadow-md ${isDragging ? 'opacity-50 scale-95' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
      >
        {/* Drag Handle */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-move">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        <CardContent className="p-3 pl-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{node.label}</div>
                <div className="text-xs text-muted-foreground truncate">{node.prompt}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`label-${node.id}`} className="text-sm">Question Label</Label>
                      <Input
                        id={`label-${node.id}`}
                        value={editData.label}
                        onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                        placeholder="e.g., Name Question"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`prompt-${node.id}`} className="text-sm">Question Prompt</Label>
                      <Textarea
                        id={`prompt-${node.id}`}
                        value={editData.prompt}
                        onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                        className="resize-none"
                        rows={3}
                        placeholder="What question will the chat ask?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`field-${node.id}`} className="text-sm">Field Name</Label>
                      <Input
                        id={`field-${node.id}`}
                        value={editData.field}
                        onChange={(e) => setEditData({ ...editData, field: e.target.value })}
                        placeholder="e.g., name, email, phone"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};