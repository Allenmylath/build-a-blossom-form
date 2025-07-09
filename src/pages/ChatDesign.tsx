import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionNode } from '@/components/chat-design/QuestionNode';
import { Plus, Save, Play } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  question: QuestionNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: 'Start Chat' },
  },
];

const initialEdges: Edge[] = [];

const questionTemplates = [
  {
    type: 'question',
    prompt: "What's your name?",
    field: 'name',
    label: 'Name Question',
  },
  {
    type: 'question',
    prompt: "What's your email address?",
    field: 'email',
    label: 'Email Question',
  },
  {
    type: 'question',
    prompt: "What's your phone number?",
    field: 'phone',
    label: 'Phone Question',
  },
  {
    type: 'question',
    prompt: "What's your website URL?",
    field: 'website',
    label: 'Website Question',
  },
  {
    type: 'question',
    prompt: 'Tell me about {customFieldName}',
    field: 'customInfo',
    label: 'Custom Question',
  },
];

export default function ChatDesign() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeCounter, setNodeCounter] = useState(1);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback((template: typeof questionTemplates[0]) => {
    const newNode: Node = {
      id: `node-${nodeCounter}`,
      type: 'question',
      position: { x: 300 + nodeCounter * 50, y: 100 + nodeCounter * 100 },
      data: {
        prompt: template.prompt,
        field: template.field,
        label: template.label,
        hook: 'useFormData',
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setNodeCounter((count) => count + 1);
  }, [nodeCounter, setNodes]);

  const saveFlow = useCallback(() => {
    const flowData = {
      nodes: nodes.reduce((acc, node) => {
        if (node.type === 'question') {
          acc[node.id] = {
            type: 'question',
            prompt: node.data.prompt,
            field: node.data.field,
            hook: node.data.hook,
          };
        }
        return acc;
      }, {} as Record<string, any>),
      edges: edges.map(edge => [edge.source, edge.target]),
    };
    
    console.log('Flow saved:', flowData);
    toast.success('Chat flow saved successfully!');
  }, [nodes, edges]);

  const previewFlow = useCallback(() => {
    toast.info('Chat flow preview coming soon!');
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chat Design</h1>
            <p className="text-muted-foreground">Design your chat flow visually</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={previewFlow} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveFlow}>
              <Save className="w-4 h-4 mr-2" />
              Save Flow
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 border-r bg-background p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Nodes</CardTitle>
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

        {/* Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls />
            <MiniMap />
            <Background gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}