
import React, { useEffect, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FormSubmissionData, FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Calendar, MapPin, Hash } from 'lucide-react';

interface VirtualizedSubmissionListProps {
  submissions: FormSubmissionData[];
  fields: FormField[];
  height: number;
  onUpdateVisibleRange?: (startIndex: number, endIndex: number) => void;
}

const ITEM_HEIGHT = 120;

const SubmissionRow = React.memo(({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: { submissions: FormSubmissionData[]; fields: FormField[] }; 
}) => {
  const { submissions, fields } = data;
  const submission = submissions[index];
  
  if (!submission) {
    return (
      <div style={style} className="p-4">
        <Card className="p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </Card>
      </div>
    );
  }
  
  return (
    <div style={style} className="p-2">
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-blue-500" />
            <Badge variant="secondary" className="font-mono text-xs">
              {submission.id.slice(0, 8).toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(submission.submittedAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            <Badge variant="outline" className="text-xs">
              {submission.ipAddress || 'Unknown'}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(submission.submittedAt).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-600 truncate">
            {fields.slice(0, 2).map(field => {
              const value = submission.data[field.id];
              return value ? `${field.label}: ${value}` : '';
            }).filter(Boolean).join(', ') || 'No data'}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  Submission Details
                  <Badge variant="secondary" className="ml-2 font-mono">
                    #{submission.id.slice(0, 8).toUpperCase()}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-2">
                  <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                  <span>IP: {submission.ipAddress || 'Unknown'}</span>
                </div>
                <div className="space-y-4">
                  {fields.map((field) => {
                    const value = submission.data[field.id];
                    return (
                      <div key={field.id} className="space-y-2">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="p-3 bg-gray-50 rounded border min-h-[40px]">
                          {Array.isArray(value) ? (
                            value.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {value.map((v, idx) => (
                                  <Badge key={idx} variant="secondary">{v}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">No selection</span>
                            )
                          ) : value ? (
                            <span>{value}</span>
                          ) : (
                            <span className="text-gray-500 italic">No response</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
});

SubmissionRow.displayName = 'SubmissionRow';

export const VirtualizedSubmissionList: React.FC<VirtualizedSubmissionListProps> = ({
  submissions,
  fields,
  height,
  onUpdateVisibleRange,
}) => {
  const listRef = useRef<List>(null);
  
  const itemData = useMemo(() => ({
    submissions,
    fields,
  }), [submissions, fields]);
  
  const handleItemsRendered = ({ visibleStartIndex, visibleStopIndex }: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    if (onUpdateVisibleRange) {
      onUpdateVisibleRange(visibleStartIndex, visibleStopIndex);
    }
  };
  
  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
        <p className="text-gray-500">
          When people submit your form, their responses will appear here for review and analysis.
        </p>
      </Card>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <List
        ref={listRef}
        height={height}
        width="100%"
        itemCount={submissions.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        onItemsRendered={handleItemsRendered}
        overscanCount={5}
      >
        {SubmissionRow}
      </List>
    </div>
  );
};
