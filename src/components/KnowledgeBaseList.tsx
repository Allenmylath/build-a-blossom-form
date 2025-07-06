
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Calendar, HardDrive } from 'lucide-react';
import { KnowledgeBase } from '@/hooks/useKnowledgeBases';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeBaseListProps {
  knowledgeBases: KnowledgeBase[];
  onDelete: (id: string) => void;
}

export const KnowledgeBaseList = ({ knowledgeBases, onDelete }: KnowledgeBaseListProps) => {
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatTokenCount = (count?: number) => {
    return count ? `${count.toLocaleString()} tokens` : 'Processing...';
  };

  if (knowledgeBases.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No knowledge bases uploaded yet</p>
          <p className="text-sm text-gray-500">
            Upload PDF files to create your knowledge base for chat forms
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {knowledgeBases.map((kb) => (
        <Card key={kb.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-red-500" />
                  {kb.name}
                </CardTitle>
                {kb.description && (
                  <CardDescription className="mt-1">
                    {kb.description}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(kb.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-1" />
                {formatFileSize(kb.file_size)}
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {formatTokenCount(kb.token_count)}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDistanceToNow(new Date(kb.created_at), { addSuffix: true })}
              </div>
            </div>
            {kb.token_count && kb.token_count > 0 && (
              <div className="mt-3">
                <Badge variant={kb.token_count > 4000 ? "destructive" : "secondary"}>
                  {kb.token_count > 4000 ? "Large file" : "Ready to use"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
