
import { useState, useMemo } from 'react';
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, Calendar, FileText, Eye, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FormAnalyticsProps {
  form: SavedForm | null;
  onClose: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const FormAnalytics = ({ form, onClose }: FormAnalyticsProps) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Handle null form case
  if (!form) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Form Analytics</h2>
            <p className="text-gray-600">No form selected for analytics</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <Eye className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Form Selected</h3>
          <p className="text-gray-500 mb-4">
            Please load a form first to view its analytics and submission data.
          </p>
          <Button onClick={onClose}>
            Go to Form Builder
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate analytics data
  const analytics = useMemo(() => {
    const submissions = form.submissions || [];
    const totalSubmissions = submissions.length;
    
    console.log('FormAnalytics calculating data for form:', form.name);
    console.log('Total submissions:', totalSubmissions);
    
    // Calculate submission trends by date
    const submissionsByDate = submissions.reduce((acc, sub) => {
      const date = new Date(sub.submittedAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(submissionsByDate)
      .map(([date, count]) => ({ date, submissions: count }))
      .slice(-7); // Last 7 days

    // Field completion rates
    const fieldStats = form.fields.map(field => {
      const completedCount = submissions.reduce((count, sub) => {
        const value = sub.data[field.id];
        return count + (value && value !== '' ? 1 : 0);
      }, 0);
      
      return {
        fieldName: field.label,
        completionRate: totalSubmissions > 0 ? Math.round((completedCount / totalSubmissions) * 100) : 0,
        completed: completedCount,
        total: totalSubmissions
      };
    });

    // Most common values for select/radio fields
    const valueAnalytics = form.fields
      .filter(field => ['select', 'radio'].includes(field.type))
      .map(field => {
        const values = submissions.map(sub => sub.data[field.id]).filter(Boolean);
        const valueCounts = values.reduce((acc, val) => {
          acc[val as string] = (acc[val as string] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(valueCounts).map(([value, count]) => ({
          name: value,
          value: count
        }));

        return {
          fieldId: field.id,
          fieldName: field.label,
          data: chartData
        };
      });

    return {
      totalSubmissions,
      chartData,
      fieldStats,
      valueAnalytics,
      averageCompletionTime: 0, // Could be calculated if we track start/end times
      lastSubmission: submissions.length > 0 ? submissions[submissions.length - 1].submittedAt : null
    };
  }, [form]);

  const handleDownloadCSV = () => {
    if (!form || form.submissions.length === 0) {
      toast({
        title: "No Data",
        description: "There are no submissions to export.",
        variant: "destructive",
      });
      return;
    }

    console.log('Exporting CSV for form:', form.name, 'with', form.submissions.length, 'submissions');

    // Create CSV headers
    const headers = ['Submission Date', 'IP Address', 'Reference ID', ...form.fields.map(field => field.label)];
    
    // Create CSV rows
    const rows = form.submissions.map(submission => {
      const row = [
        new Date(submission.submittedAt).toLocaleString(),
        submission.ipAddress || 'N/A',
        submission.id.slice(0, 8).toUpperCase(),
        ...form.fields.map(field => {
          const value = submission.data[field.id];
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return value || '';
        })
      ];
      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analytics.csv`;
    link.click();

    toast({
      title: "CSV Downloaded",
      description: "Form analytics have been exported successfully.",
    });
  };

  const selectedSubmission = selectedEntry 
    ? form.submissions.find(sub => sub.id === selectedEntry)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics for "{form.name}"</h2>
          <p className="text-gray-600">Comprehensive insights and data export</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadCSV} className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={onClose}>
            <Eye className="w-4 h-4 mr-2" />
            Back to Form
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="fields">Field Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalSubmissions}</div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{form.fields.length}</div>
                  <div className="text-sm text-gray-600">Form Fields</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.chartData.reduce((sum, item) => sum + item.submissions, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Recent (7 days)</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-sm font-bold text-orange-600">
                    {analytics.lastSubmission 
                      ? new Date(analytics.lastSubmission).toLocaleDateString()
                      : 'No submissions'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Last Submission</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Submission Trend Chart */}
          {analytics.chartData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Submission Trend (Last 7 Days)</h3>
              <ChartContainer
                config={{
                  submissions: {
                    label: "Submissions",
                    color: "#8884d8",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="submissions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          )}

          {/* Field Completion Rates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Field Completion Rates</h3>
            <div className="space-y-3">
              {analytics.fieldStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{stat.fieldName}</div>
                    <div className="text-sm text-gray-600">
                      {stat.completed} of {stat.total} submissions
                    </div>
                  </div>
                  <Badge variant={stat.completionRate >= 80 ? "default" : "secondary"}>
                    {stat.completionRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          {form.submissions.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
              <p className="text-gray-500">When people submit your form, their responses will appear here.</p>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Submissions List */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">All Submissions</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {form.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedEntry === submission.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedEntry(submission.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            IP: {submission.ipAddress || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Selected Submission Details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedSubmission ? 'Submission Details' : 'Select a Submission'}
                </h3>
                {selectedSubmission ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </div>
                    <div className="space-y-3">
                      {form.fields.map((field) => {
                        const value = selectedSubmission.data[field.id];
                        return (
                          <div key={field.id} className="border-b border-gray-100 pb-2">
                            <div className="font-medium text-sm text-gray-700">{field.label}</div>
                            <div className="mt-1">
                              {Array.isArray(value) ? (
                                value.length > 0 ? value.join(', ') : 'No selection'
                              ) : (
                                value || 'No response'
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Click on a submission to view its details
                  </div>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          {analytics.valueAnalytics.length === 0 ? (
            <Card className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Available</h3>
              <p className="text-gray-500">
                Field analytics are available for select and radio button fields with submissions.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {analytics.valueAnalytics.map((fieldAnalytic) => (
                <Card key={fieldAnalytic.fieldId} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{fieldAnalytic.fieldName}</h3>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Responses",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fieldAnalytic.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {fieldAnalytic.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
