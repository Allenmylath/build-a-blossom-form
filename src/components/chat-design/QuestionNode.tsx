import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, MessageSquare, Save, X } from 'lucide-react';

interface QuestionNodeData {
  prompt: string;
  field: string;
  label: string;
  hook: string;
}

export const QuestionNode = memo(({ data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data as unknown as QuestionNodeData);

  const handleSave = () => {
    // Update the node data
    Object.assign(data, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data as unknown as QuestionNodeData);
    setIsEditing(false);
  };

  const nodeData = data as unknown as QuestionNodeData;

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Question Node
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-xs">Prompt</Label>
              <Textarea
                id="prompt"
                value={editData.prompt}
                onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                className="text-xs resize-none"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field" className="text-xs">Field Name</Label>
              <Input
                id="field"
                value={editData.field}
                onChange={(e) => setEditData({ ...editData, field: e.target.value })}
                className="text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="label" className="text-xs">Label</Label>
              <Input
                id="label"
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                className="text-xs"
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
          <>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Prompt:</div>
              <div className="text-xs bg-muted p-2 rounded">{nodeData.prompt}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Field:</div>
              <div className="text-xs bg-muted p-2 rounded font-mono">{nodeData.field}</div>
            </div>
          </>
        )}
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});