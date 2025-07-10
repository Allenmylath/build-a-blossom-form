import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LinearFlowNode } from '@/components/chat-design/LinearFlowNode';
import { ChatFlowSaveDialog } from '@/components/chat-design/ChatFlowSaveDialog';
import { ChatFlowManager } from '@/components/chat-design/ChatFlowManager';
import { useChatFlows, ChatFlow } from '@/hooks/useChatFlows';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { 
  Plus, 
  Save, 
  Play, 
  ArrowDown, 
  Sparkles,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  HelpCircle,
  FileText,
  PlusCircle,
  Workflow,
  Calendar,
  AlertCircle
} from 'lucide-react';
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
    icon: MessageSquare,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    prompt: "What's your email address?",
    field: 'email',
    label: 'Email Question',
    icon: Mail,
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    prompt: "What's your phone number?",
    field: 'phone',
    label: 'Phone Question',
    icon: Phone,
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    prompt: "What's your website URL?",
    field: 'website',
    label: 'Website Question',
    icon: Globe,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    prompt: 'Tell me about {customFieldName}',
    field: 'customInfo',
    label: 'Custom Question',
    icon: HelpCircle,
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    iconColor: 'text-pink-600'
  },
];

export default function ChatDesign() {
  const { user } = useSupabaseAuth();
  const { chatFlows, loading, saveChatFlow, updateChatFlow, deleteChatFlow } = useChatFlows(user);
  const { isConnected, calendarEmail } = useCalendarIntegration(user);
  
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
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

  const handleCalendarAppointmentClick = useCallback(() => {
    if (!isConnected) {
      toast.error('Calendar Integration Required', {
        description: 'Please connect your Google Calendar in Settings before adding appointment booking to your flow.',
        action: {
          label: 'Go to Settings',
          onClick: () => window.location.href = '/settings'
        }
      });
      return;
    }

    const appointmentNode: FlowNode = {
      id: `node-${nodeCounter}`,
      type: 'question',
      prompt: 'Please select a time for your appointment',
      field: 'appointment',
      label: 'Calendar Appointment',
      hook: 'useCalendarBooking',
    };
    setFlowNodes(prev => [...prev, appointmentNode]);
    setNodeCounter(prev => prev + 1);
    toast.success('Calendar appointment tool added to your flow!');
  }, [isConnected, nodeCounter]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Workflow className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Chat Flow Designer</h1>
                  <p className="text-slate-600 text-sm">
                    {flowName ? (
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Editing: <span className="font-medium">{flowName}</span>
                      </span>
                    ) : (
                      'Create and manage conversational workflows'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={handleNewFlow} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                New Flow
              </Button>
              
              <Button 
                onClick={previewFlow} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Preview
              </Button>
              
              <Button 
                onClick={handleSaveClick} 
                disabled={flowNodes.length === 0}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4" />
                {currentFlow ? 'Update' : 'Save'} Flow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="design" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white border border-slate-200 p-1">
            <TabsTrigger 
              value="design" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Design Flow
            </TabsTrigger>
            <TabsTrigger 
              value="manage"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Flows
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Question Templates Sidebar */}
              <div className="col-span-12 lg:col-span-3">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Question Templates
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Click to add questions to your flow
                    </p>
                  </CardHeader>
                   <CardContent className="space-y-3">
                     {questionTemplates.map((template, index) => {
                       const IconComponent = template.icon;
                       return (
                         <button
                           key={index}
                           onClick={() => addNode(template)}
                           className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left group ${template.color}`}
                         >
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-md bg-white/80 ${template.iconColor}`}>
                               <IconComponent className="w-4 h-4" />
                             </div>
                             <div>
                               <div className="font-medium text-slate-900 group-hover:text-slate-700">
                                 {template.label}
                               </div>
                               <div className="text-xs text-slate-600 mt-1">
                                 {template.prompt}
                               </div>
                             </div>
                           </div>
                         </button>
                       );
                     })}
                     
                     {/* Calendar Appointment Section */}
                     <div className="pt-4 border-t border-slate-200">
                       <div className="flex items-center gap-2 mb-3">
                         <Calendar className="w-4 h-4 text-slate-600" />
                         <span className="text-sm font-medium text-slate-700">Appointment Booking</span>
                       </div>
                       
                       <button
                         onClick={handleCalendarAppointmentClick}
                         className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                           isConnected 
                             ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' 
                             : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-75'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-md ${
                             isConnected 
                               ? 'bg-white/80 text-indigo-600' 
                               : 'bg-white/80 text-slate-400'
                           }`}>
                             {isConnected ? (
                               <Calendar className="w-4 h-4" />
                             ) : (
                               <AlertCircle className="w-4 h-4" />
                             )}
                           </div>
                           <div className="flex-1">
                             <div className={`font-medium group-hover:text-slate-700 ${
                               isConnected ? 'text-slate-900' : 'text-slate-500'
                             }`}>
                               Calendar Appointment
                             </div>
                             <div className="text-xs text-slate-600 mt-1">
                               {isConnected 
                                 ? 'Let users book appointments directly'
                                 : 'Calendar integration required'
                               }
                             </div>
                             {isConnected && calendarEmail && (
                               <div className="text-xs text-indigo-600 mt-1">
                                 Connected: {calendarEmail}
                               </div>
                             )}
                           </div>
                           {!isConnected && (
                             <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                               Setup Required
                             </div>
                           )}
                         </div>
                       </button>
                     </div>
                   </CardContent>
                </Card>
              </div>

              {/* Flow Canvas */}
              <div className="col-span-12 lg:col-span-9">
                <Card className="bg-white border-slate-200 shadow-sm min-h-[600px]">
                  <CardContent className="p-8">
                    <div className="max-w-3xl mx-auto">
                      {/* Start Badge */}
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-6 py-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                            Start
                          </Badge>
                          <span className="text-sm text-green-700 font-medium">Chat begins here</span>
                        </div>
                      </div>

                      {/* Flow Content */}
                      {flowNodes.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-900 mb-2">
                            No questions added yet
                          </h3>
                          <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Start building your chat flow by adding question templates from the sidebar.
                            Each question will guide your users through the conversation.
                          </p>
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <ArrowDown className="w-4 h-4" />
                            <span>Add your first question to get started</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Connection line from start */}
                          <div className="flex justify-center">
                            <div className="w-px h-8 bg-gradient-to-b from-green-300 to-primary/30"></div>
                          </div>

                          {flowNodes.map((node, index) => (
                            <div key={node.id} className="relative">
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
                                <div className="flex justify-center py-4">
                                  <div className="w-px h-6 bg-gradient-to-b from-primary/30 to-primary/30"></div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Connection line to end */}
                          <div className="flex justify-center">
                            <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-red-300"></div>
                          </div>

                          {/* End Badge */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200 rounded-full px-6 py-3">
                              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
                                End
                              </Badge>
                              <span className="text-sm text-red-700 font-medium">Chat completes here</span>
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <ChatFlowManager
                  chatFlows={chatFlows}
                  onSelect={handleLoadFlow}
                  onDelete={deleteChatFlow}
                  loading={loading}
                />
              </CardContent>
            </Card>
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
