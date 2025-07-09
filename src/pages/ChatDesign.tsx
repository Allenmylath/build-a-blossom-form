import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LinearFlowNode } from '@/components/chat-design/LinearFlowNode';
import { ChatFlowSaveDialog } from '@/components/chat-design/ChatFlowSaveDialog';
import { ChatFlowManager } from '@/components/chat-design/ChatFlowManager';
import { useChatFlows, ChatFlow } from '@/hooks/useChatFlows';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Plus, Save, Play, ArrowDown, Folder, Upload, Settings } from 'lucide-react';
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
  const { user } = useSupabaseAuth();
  const { chatFlows, loading, saveChatFlow, updateChatFlow, deleteChatFlow } = useChatFlows(user);
  
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<ChatFlow | null>(null);
  const [flowName, setFlowName] = useState('');

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

  const handleSaveFlow = useCallback(async (data?: { name: string; description?: string }) => {
    if (flowNodes.length === 0) {
      toast.error('Cannot save empty chat flow');
      return;
    }

    // Convert to nodes/edges format
    const nodes: Record<string, any> = {};
    const edges: [string, string][] = [];

    flowNodes.forEach((node, index) => {
      nodes[node.id] = {
        type: node.type,
        prompt: node.prompt,
        field: node.field,
        hook: node.hook,
      };

      // Create edges
      if (index === 0) {
        edges.push(['start', node.id]);
      }
      if (index < flowNodes.length - 1) {
        edges.push([node.id, flowNodes[index + 1].id]);
      }
      if (index === flowNodes.length - 1) {
        edges.push([node.id, 'end']);
      }
    });

    const flowData = { nodes, edges };

    if (currentFlow) {
      // Update existing flow - no dialog needed
      const updated = await updateChatFlow(currentFlow.id, {
        flow_data: flowData,
      });
      if (updated) {
        setCurrentFlow(updated);
        toast.success('Flow updated successfully!');
      }
    } else if (data) {
      // Create new flow with provided data
      const saved = await saveChatFlow({
        name: data.name,
        description: data.description,
        flow_data: flowData,
      });
      if (saved) {
        setCurrentFlow(saved);
        setFlowName(saved.name);
      }
    }
  }, [flowNodes, currentFlow, saveChatFlow, updateChatFlow]);

  const handleSaveClick = useCallback(() => {
    if (currentFlow) {
      // Update existing flow directly
      handleSaveFlow();
    } else {
      // New flow - show dialog
      setShowSaveDialog(true);
    }
  }, [currentFlow, handleSaveFlow]);

  const handleLoadFlow = useCallback((flow: ChatFlow) => {
    if (flow.flow_data && flow.flow_data.nodes) {
      // Handle nodes/edges format
      const nodes = Object.entries(flow.flow_data.nodes).map(([id, nodeData]: [string, any]) => ({
        id,
        type: nodeData.type,
        prompt: nodeData.prompt,
        field: nodeData.field,
        label: nodeData.label || `${nodeData.field} Question`,
        hook: nodeData.hook,
      }));
      
      // Sort nodes by edge order
      const sortedNodes = [...nodes];
      if (flow.flow_data.edges) {
        const edgeOrder: string[] = [];
        flow.flow_data.edges.forEach(([from, to]: [string, string]) => {
          if (from === 'start') edgeOrder.push(to);
        });
        
        sortedNodes.sort((a, b) => {
          const aIndex = edgeOrder.indexOf(a.id);
          const bIndex = edgeOrder.indexOf(b.id);
          return aIndex - bIndex;
        });
      }
      
      setFlowNodes(sortedNodes);
      setCurrentFlow(flow);
      setFlowName(flow.name);
      setNodeCounter(Math.max(...sortedNodes.map((n: any) => parseInt(n.id.split('-')[1]) || 0)) + 1);
      setShowLoadDialog(false);
      toast.success(`Loaded chat flow: ${flow.name}`);
    } else if (Array.isArray(flow.flow_data)) {
      // Handle legacy array format
      const nodes = flow.flow_data.map((nodeData: any) => ({
        id: nodeData.id,
        type: nodeData.type,
        prompt: nodeData.prompt,
        field: nodeData.field,
        label: nodeData.label,
        hook: nodeData.hook,
      }));
      
      setFlowNodes(nodes);
      setCurrentFlow(flow);
      setFlowName(flow.name);
      setNodeCounter(Math.max(...nodes.map((n: any) => parseInt(n.id.split('-')[1]) || 0)) + 1);
      setShowLoadDialog(false);
      toast.success(`Loaded chat flow: ${flow.name}`);
    }
  }, []);

  const handleNewFlow = useCallback(() => {
    setFlowNodes([]);
    setCurrentFlow(null);
    setFlowName('');
    setNodeCounter(1);
    toast.success('Started new chat flow');
  }, []);

  const previewFlow = useCallback(() => {
    toast.info('Chat flow preview coming soon!');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chat Design</h1>
            <p className="text-slate-600 mt-1">
              {flowName ? `Editing: ${flowName}` : 'Design and manage chat flows'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleNewFlow} variant="outline" className="font-medium">
              New Flow
            </Button>
            
            <Button onClick={previewFlow} variant="outline" className="font-medium">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              onClick={handleSaveClick} 
              disabled={flowNodes.length === 0}
              className="font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {currentFlow ? 'Update' : 'Save'} Flow
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Tabs defaultValue="design" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="design">Design Flow</TabsTrigger>
            <TabsTrigger value="manage">Manage Flows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="flex-1 flex mt-0">
            {/* Question Templates Sidebar */}
            <div className="w-64 border-r bg-slate-50 p-4">
              <div className="mb-3">
                <Badge className="bg-blue-600 text-white text-xs font-semibold px-2 py-1">
                  TEMPLATES PANEL
                </Badge>
              </div>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">Question Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {questionTemplates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => addNode(template)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {template.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 p-6 overflow-auto bg-slate-50">
              <div className="mb-4">
                <Badge className="bg-blue-600 text-white text-xs font-semibold px-2 py-1">
                  FLOW CANVAS
                </Badge>
              </div>
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
          </TabsContent>
          
          <TabsContent value="manage" className="flex-1 mt-0 p-6 bg-slate-50">
            <div className="mb-4">
              <Badge className="bg-blue-600 text-white text-xs font-semibold px-2 py-1">
                SAVED FLOWS
              </Badge>
            </div>
            <ChatFlowManager
              chatFlows={chatFlows}
              onSelect={handleLoadFlow}
              onDelete={deleteChatFlow}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <ChatFlowSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFlow}
        initialData={currentFlow ? {
          name: currentFlow.name,
          description: currentFlow.description,
        } : undefined}
      />
    </div>
  );
}