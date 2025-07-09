import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinearFlowNode } from '@/components/chat-design/LinearFlowNode';
import { Plus, Save, Play, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface FlowNode {
  id: string;
  type: 'question';
  prompt: string;
  field: string;
  label: string;
  hook: string;
}

const questionTemplates = [
  {
    prompt: "What's your name?",
    field: 'name',
    label: 'Name Question',
  },
  {
    prompt: "What's your email address?",
    field: 'email',
    label: 'Email Question',
  },
  {
    prompt: "What's your phone number?",
    field: 'phone',
    label: 'Phone Question',
  },
  {
    prompt: "What's your website URL?",
    field: 'website',
    label: 'Website Question',
  },
  {
    prompt: 'Tell me about {customFieldName}',
    field: 'customInfo',
    label: 'Custom Question',
  },
];

export default function ChatDesign() {
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addNode = useCallback((template: typeof questionTemplates[0]) => {
    const newNode: FlowNode = {
      id: `node-${nodeCounter}`,
      type: 'question',
      prompt: template.prompt,
      field: template.field,
      label: template.label,
      hook: 'useFormData',
    };
    setFlowNodes(prev => [...prev, newNode]);
    setNodeCounter(prev => prev + 1);
  }, [nodeCounter]);

  const removeNode = useCallback((id: string) => {
    setFlowNodes(prev => prev.filter(node => node.id !== id));
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<FlowNode>) => {
    setFlowNodes(prev => prev.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  }, []);

  const moveNode = useCallback((fromIndex: number, toIndex: number) => {
    setFlowNodes(prev => {
      const newNodes = [...prev];
      const [movedNode] = newNodes.splice(fromIndex, 1);
      newNodes.splice(toIndex, 0, movedNode);
      return newNodes;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveNode(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const saveFlow = useCallback(() => {
    const flowData = {
      nodes: flowNodes.reduce((acc, node, index) => {
        acc[node.id] = {
          type: 'question',
          prompt: node.prompt,
          field: node.field,
          hook: node.hook,
          order: index,
        };
        return acc;
      }, {} as Record<string, any>),
      edges: flowNodes.map((node, index) => {
        if (index === 0) return ['start', node.id];
        if (index === flowNodes.length - 1) return [node.id, 'end'];
        return [flowNodes[index - 1].id, node.id];
      }).filter(Boolean),
    };
    
    console.log('Linear flow saved:', flowData);
    toast.success('Chat flow saved successfully!');
  }, [flowNodes]);

  const previewFlow = useCallback(() => {
    toast.info('Chat flow preview coming soon!');
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chat Design</h1>
            <p className="text-muted-foreground">Create a linear chat flow</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={previewFlow} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveFlow} disabled={flowNodes.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Save Flow
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Question Templates */}
        <div className="w-64 border-r bg-background p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questionTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode(template)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {template.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Linear Flow */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Start</Badge>
                <p className="text-sm text-muted-foreground">Chat begins here</p>
              </div>
              {flowNodes.length > 0 && (
                <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto mb-4" />
              )}
            </div>

            {flowNodes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No questions added yet</p>
                <p className="text-sm text-muted-foreground">
                  Add question templates from the left panel to build your chat flow
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {flowNodes.map((node, index) => (
                  <div key={node.id}>
                    <LinearFlowNode
                      node={node}
                      index={index}
                      onUpdate={updateNode}
                      onRemove={removeNode}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={draggedIndex === index}
                    />
                    {index < flowNodes.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {flowNodes.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">End</Badge>
                  <p className="text-sm text-muted-foreground">Chat completes here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}