import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChatFlow } from '@/hooks/useChatFlows';
import { Folder, MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatFlowManagerProps {
  chatFlows: ChatFlow[];
  onSelect: (flow: ChatFlow) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export const ChatFlowManager = ({ 
  chatFlows, 
  onSelect, 
  onDelete, 
  loading 
}: ChatFlowManagerProps) => {
  const [selectedFlow, setSelectedFlow] = useState<ChatFlow | null>(null);

  const handleSelect = (flow: ChatFlow) => {
    setSelectedFlow(flow);
    onSelect(flow);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const getStepCount = (flowData: any) => {
    if (flowData?.nodes) {
      return Object.keys(flowData.nodes).length;
    } else if (Array.isArray(flowData)) {
      return flowData.length;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse shadow-sm">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (chatFlows.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Chat Flows</h3>
        <p className="text-slate-500 text-sm">
          Create your first chat flow to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chatFlows.map((flow) => (
        <Card key={flow.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-base">{flow.name}</h3>
                  <Badge 
                    variant="secondary" 
                    className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1"
                  >
                    {getStepCount(flow.flow_data)} steps
                  </Badge>
                </div>
                
                {flow.description && (
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                    {flow.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>Updated {formatDistanceToNow(new Date(flow.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSelect(flow)}
                  className="text-sm font-medium"
                  variant="outline"
                >
                  Load
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg">
                    <DropdownMenuItem onClick={() => handleSelect(flow)} className="text-sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(flow.id)}
                      className="text-destructive text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};