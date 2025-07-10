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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-100/30">
      {/* Modern Header with Gradient */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                    <Workflow className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Chat Flow Designer
                  </h1>
                  <p className="text-slate-600 text-sm mt-1">
                    {flowName ? (
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700">Editing:</span>
                        <span className="font-semibold text-blue-800">{flowName}</span>
                      </span>
                    ) : (
                      'Create intelligent conversational workflows with ease'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={handleNewFlow} 
                variant="outline"
                className="flex items-center gap-2 bg-white/50 backdrop-blur border-slate-300 hover:bg-white/80 hover:shadow-md transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                New Flow
              </Button>
              
              <Button 
                onClick={previewFlow} 
                variant="outline"
                className="flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                Preview
              </Button>
              
              <Button 
                onClick={handleSaveClick} 
                disabled={flowNodes.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {currentFlow ? 'Update' : 'Save'} Flow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-10">
        <Tabs defaultValue="design" className="space-y-8">
          <TabsList className="grid w-full max-w-xl mx-auto grid-cols-2 bg-white/60 backdrop-blur-lg border border-slate-200/50 p-1.5 rounded-2xl shadow-lg">
            <TabsTrigger 
              value="design" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Design Flow
            </TabsTrigger>
            <TabsTrigger 
              value="manage"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Flows
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="space-y-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Enhanced Question Templates Sidebar */}
              <div className="col-span-12 lg:col-span-4">
                <Card className="bg-white/60 backdrop-blur-lg border border-slate-200/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-slate-100/50">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      Question Templates
                    </CardTitle>
                    <p className="text-sm text-slate-600 ml-11">
                      Drag and drop or click to add interactive elements
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    {questionTemplates.map((template, index) => {
                      const IconComponent = template.icon;
                      return (
                        <div
                          key={index}
                          className="group cursor-pointer transform hover:scale-[1.02] transition-all duration-200"
                          onClick={() => addNode(template)}
                        >
                          <div className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-lg ${template.color} border-opacity-60 hover:border-opacity-100`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl bg-white/90 shadow-sm ${template.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 group-hover:text-slate-700 text-base">
                                  {template.label}
                                </div>
                                <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                                  {template.prompt}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Enhanced Calendar Appointment Section */}
                    <div className="pt-6 border-t border-slate-200/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-base font-semibold text-slate-800">Appointment Booking</span>
                      </div>
                      
                      <div
                        className={`group cursor-pointer transform hover:scale-[1.02] transition-all duration-200 ${
                          !isConnected ? 'opacity-75 hover:opacity-90' : ''
                        }`}
                        onClick={handleCalendarAppointmentClick}
                      >
                        <div className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-lg ${
                          isConnected 
                            ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl shadow-sm transition-all duration-200 flex-shrink-0 ${
                              isConnected 
                                ? 'bg-white/90 text-indigo-600 group-hover:scale-110' 
                                : 'bg-white/90 text-slate-400'
                            }`}>
                              {isConnected ? (
                                <Calendar className="w-5 h-5" />
                              ) : (
                                <AlertCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-base leading-tight ${
                                isConnected ? 'text-slate-900' : 'text-slate-500'
                              }`}>
                                Calendar Appointment
                              </div>
                              <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                                {isConnected 
                                  ? 'Enable direct appointment booking'
                                  : 'Connect calendar to enable bookings'
                                }
                              </div>
                              {isConnected && calendarEmail && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                  <span className="text-xs text-indigo-600 font-medium truncate">
                                    {calendarEmail}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {!isConnected && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-1 whitespace-nowrap">
                                  Setup Required
                                </Badge>
                              )}
                              {isConnected && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1 whitespace-nowrap">
                                  Ready
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Flow Canvas */}
              <div className="col-span-12 lg:col-span-8">
                <Card className="bg-white/60 backdrop-blur-lg border border-slate-200/50 shadow-xl rounded-2xl overflow-hidden min-h-[700px]">
                  <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/50">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      Flow Canvas
                      {flowNodes.length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-auto">
                          {flowNodes.length} step{flowNodes.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-600 ml-11">
                      Design your conversational flow step by step
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="max-w-4xl mx-auto">
                      {/* Enhanced Start Badge */}
                      <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl px-8 py-4 shadow-lg">
                          <div className="relative">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 px-4 py-2 text-sm font-semibold">
                            Start
                          </Badge>
                          <span className="text-emerald-700 font-medium">Conversation begins here</span>
                        </div>
                      </div>

                      {/* Enhanced Flow Content */}
                      {flowNodes.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="relative mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                              <MessageSquare className="w-12 h-12 text-slate-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Ready to Build Something Amazing?
                          </h3>
                          <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                            Start crafting your intelligent conversation flow by adding question templates from the sidebar. 
                            Each step will guide your users through a seamless experience.
                          </p>
                          <div className="flex items-center justify-center gap-3 text-primary bg-primary/5 px-6 py-3 rounded-full border border-primary/20">
                            <ArrowDown className="w-5 h-5 animate-bounce" />
                            <span className="font-medium">Choose a template to get started</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Enhanced Connection line from start */}
                          <div className="flex justify-center">
                            <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 via-primary/50 to-primary/30 rounded-full shadow-sm"></div>
                          </div>

                          {flowNodes.map((node, index) => (
                            <div key={node.id} className="relative">
                              <div className="transform hover:scale-[1.01] transition-all duration-200">
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
                              </div>
                              {index < flowNodes.length - 1 && (
                                <div className="flex justify-center py-6">
                                  <div className="relative">
                                    <div className="w-1 h-10 bg-gradient-to-b from-primary/40 to-primary/30 rounded-full"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary/20 rounded-full animate-pulse"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Enhanced Connection line to end */}
                          <div className="flex justify-center">
                            <div className="w-1 h-12 bg-gradient-to-b from-primary/30 via-rose-300 to-rose-400 rounded-full shadow-sm"></div>
                          </div>

                          {/* Enhanced End Badge */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 rounded-2xl px-8 py-4 shadow-lg">
                              <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-300 px-4 py-2 text-sm font-semibold">
                                Complete
                              </Badge>
                              <span className="text-rose-700 font-medium">Conversation ends here</span>
                              <div className="relative">
                                <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
                                <div className="absolute inset-0 w-4 h-4 bg-rose-400 rounded-full animate-ping opacity-20"></div>
                              </div>
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
