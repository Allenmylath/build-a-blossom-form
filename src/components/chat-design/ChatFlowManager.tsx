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
      <div className="p-6 flex flex-col">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (chatFlows.length === 0) {
    return (
      <div className="p-6 text-center flex flex-col justify-center min-h-64">
        <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Chat Flows</h3>
        <p className="text-muted-foreground text-sm">
          Create your first chat flow to get started
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col">
      <div className="space-y-4">
        {chatFlows.map((flow) => (
          <Card key={flow.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{flow.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {getStepCount(flow.flow_data)} steps
                    </Badge>
                  </div>
                  
                  {flow.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {flow.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Updated {formatDistanceToNow(new Date(flow.updated_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSelect(flow)}
                    className="text-xs"
                  >
                    Load
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSelect(flow)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(flow.id)}
                        className="text-destructive"
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
    </div>
  );
};