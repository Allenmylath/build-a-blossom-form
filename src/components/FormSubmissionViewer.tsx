
import { useState } from 'react';
import { FormSubmissionData, FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Calendar, MapPin, Loader2 } from 'lucide-react';

interface FormSubmissionViewerProps {
  submissions: FormSubmissionData[];
  fields: FormField[];
  onExportCSV: () => void;
  isRefreshing?: boolean;
}

export const FormSubmissionViewer = ({ submissions, fields, onExportCSV, isRefreshing = false }: FormSubmissionViewerProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionData | null>(null);

  if (submissions.length === 0 && !isRefreshing) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-lg font-semibold">Form Submissions</h3>
            <p className="text-sm text-gray-600">{submissions.length} total submissions</p>
          </div>
          {isRefreshing && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
        <Button onClick={onExportCSV} className="flex items-center" disabled={submissions.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {isRefreshing && submissions.length === 0 ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Submissions</h3>
          <p className="text-gray-500">Please wait while we fetch the latest data...</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <Badge variant="outline">
                        {submission.ipAddress || 'Unknown'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-gray-600">
                      {fields.slice(0, 2).map(field => {
                        const value = submission.data[field.id];
                        return value ? `${field.label}: ${value}` : '';
                      }).filter(Boolean).join(', ') || 'No data'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submission Details</DialogTitle>
                        </DialogHeader>
                        {selectedSubmission && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-2">
                              <span>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                              <span>IP: {selectedSubmission.ipAddress || 'Unknown'}</span>
                            </div>
                            <div className="space-y-4">
                              {fields.map((field) => {
                                const value = selectedSubmission.data[field.id];
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
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
