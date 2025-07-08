import { useState, useMemo, useEffect } from 'react';
import { SavedForm } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  Eye, 
  AlertCircle, 
  MessageCircle, 
  Bot, 
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FormAnalyticsProps {
  form: SavedForm | null;
  onClose: () => void;
}

interface ChatSession {
  id: string;
  formFieldId: string;
  sessionKey: string;
  userId?: string;
  totalMessages: number;
  lastActivity: Date;
  createdAt: Date;
  isActive: boolean;
  fullTranscript: Array<{
    id: string;
    type: string;
    content: string;
    timestamp: string;
    messageIndex?: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const FormAnalytics = ({ form, onClose }: FormAnalyticsProps) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Determine if this form has chat fields
  const hasChatFields = useMemo(() => {
    return form?.fields.some(field => field.type === 'chat') || false;
  }, [form]);

  // Determine form type for better analytics categorization
  const formType = useMemo(() => {
    if (!form) return 'unknown';
    const chatFields = form.fields.filter(f => f.type === 'chat').length;
    const traditionalFields = form.fields.filter(f => f.type !== 'chat' && f.type !== 'page-break').length;
    
    if (chatFields > 0 && traditionalFields > 0) return 'hybrid';
    if (chatFields > 0 && traditionalFields === 0) return 'chat-only';
    return 'traditional';
  }, [form]);

  // Load chat sessions for forms with chat fields
  useEffect(() => {
    if (form && hasChatFields) {
      loadChatSessions();
    }
  }, [form, hasChatFields]);

  const loadChatSessions = async (showRefreshIndicator = false) => {
    if (!form) return;
    
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoadingChatSessions(true);
    }
    
    try {
      console.log('Loading chat sessions for form:', form.id);
      
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('form_id', form.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chat sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load chat sessions",
          variant: "destructive",
        });
        return;
      }

      const formattedSessions: ChatSession[] = (sessions || []).map(session => ({
        id: session.id,
        formFieldId: session.form_field_id,
        sessionKey: session.session_key,
        userId: session.user_id,
        totalMessages: session.total_messages || 0,
        lastActivity: new Date(session.last_activity || session.updated_at),
        createdAt: new Date(session.created_at),
        isActive: session.is_active || false,
        fullTranscript: Array.isArray(session.full_transcript) ? session.full_transcript as Array<{
          id: string;
          type: string;
          content: string;
          timestamp: string;
          messageIndex?: number;
        }> : []
      }));

      setChatSessions(formattedSessions);
      console.log('Loaded chat sessions:', formattedSessions.length);

    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setLoadingChatSessions(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    if (hasChatFields) {
      loadChatSessions(true);
    }
  };

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

  // Calculate analytics data for traditional forms
  const submissionAnalytics = useMemo(() => {
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

    // Field completion rates (exclude chat and page-break fields)
    const traditionalFields = form.fields.filter(field => 
      field.type !== 'chat' && field.type !== 'page-break'
    );
    
    const fieldStats = traditionalFields.map(field => {
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
      lastSubmission: submissions.length > 0 ? submissions[submissions.length - 1].submittedAt : null
    };
  }, [form]);

  // Calculate chat analytics data
  const chatAnalytics = useMemo(() => {
    const totalSessions = chatSessions.length;
    const totalMessages = chatSessions.reduce((sum, session) => sum + session.totalMessages, 0);
    const activeSessions = chatSessions.filter(session => {
      const hoursSinceActivity = (Date.now() - session.lastActivity.getTime()) / (1000 * 60 * 60);
      return hoursSinceActivity < 24; // Active in last 24 hours
    }).length;

    const authenticatedSessions = chatSessions.filter(s => s.userId).length;
    const anonymousSessions = chatSessions.filter(s => !s.userId).length;
    const sessionsWithMessages = chatSessions.filter(s => s.totalMessages > 0).length;

    // Sessions by date
    const sessionsByDate = chatSessions.reduce((acc, session) => {
      const date = session.createdAt.toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sessionChartData = Object.entries(sessionsByDate)
      .map(([date, count]) => ({ date, sessions: count }))
      .slice(-7); // Last 7 days

    // Average messages per session (only for sessions with messages)
    const avgMessagesPerSession = sessionsWithMessages > 0 ? 
      Math.round(totalMessages / sessionsWithMessages) : 0;

    return {
      totalSessions,
      totalMessages,
      activeSessions,
      authenticatedSessions,
      anonymousSessions,
      sessionsWithMessages,
      avgMessagesPerSession,
      sessionChartData,
      lastSession: chatSessions.length > 0 ? chatSessions[0].createdAt : null
    };
  }, [chatSessions]);

  const handleDownloadCSV = () => {
    if (!form) return;

    // For chat forms, export chat sessions
    if (hasChatFields && chatSessions.length > 0) {
      const headers = [
        'Session ID', 
        'Created Date', 
        'Last Activity', 
        'Total Messages', 
        'User Type', 
        'Field ID',
        'Status',
        'Session Key'
      ];
      
      const rows = chatSessions.map(session => [
        session.id.slice(0, 8).toUpperCase(),
        session.createdAt.toLocaleString(),
        session.lastActivity.toLocaleString(),
        session.totalMessages.toString(),
        session.userId ? 'Authenticated' : 'Anonymous',
        session.formFieldId,
        session.isActive ? 'Active' : 'Inactive',
        session.sessionKey
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${form.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat_analytics.csv`;
      link.click();

      toast({
        title: "CSV Downloaded",
        description: "Chat session analytics have been exported successfully.",
      });
      return;
    }

    // For traditional forms, export submissions
    if (form.submissions.length === 0) {
      toast({
        title: "No Data",
        description: "There are no submissions to export.",
        variant: "destructive",
      });
      return;
    }

    console.log('Exporting CSV for form:', form.name, 'with', form.submissions.length, 'submissions');

    const traditionalFields = form.fields.filter(f => f.type !== 'chat' && f.type !== 'page-break');
    const headers = ['Submission Date', 'IP Address', 'Reference ID', ...traditionalFields.map(field => field.label)];
    
    const rows = form.submissions.map(submission => {
      const row = [
        new Date(submission.submittedAt).toLocaleString(),
        submission.ipAddress || 'N/A',
        submission.id.slice(0, 8).toUpperCase(),
        ...traditionalFields.map(field => {
          const value = submission.data[field.id];
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return value || '';
        })
      ];
      return row;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

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

  const getFormTypeDisplay = () => {
    switch (formType) {
      case 'chat-only': return 'Chat Form';
      case 'hybrid': return 'Hybrid Form (Traditional + Chat)';
      case 'traditional': return 'Traditional Form';
      default: return 'Form';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics for "{form.name}"</h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">{getFormTypeDisplay()}</p>
            <Badge variant="outline" className="text-xs">
              {form.fields.length} fields
            </Badge>
            {hasChatFields && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat Enabled
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChatFields && (
            <Button 
              onClick={refreshData} 
              disabled={refreshing}
              variant="outline" 
              size="sm"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          )}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {hasChatFields ? (
            <>
              <TabsTrigger value="chat-sessions">
                Chat Sessions
                <Badge variant="secondary" className="ml-2 text-xs">
                  {chatSessions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="entries">
                Entries
                <Badge variant="secondary" className="ml-2 text-xs">
                  {form.submissions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="field-analysis">Field Analysis</TabsTrigger>
            </>
          )}
          <TabsTrigger value="fields">Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {hasChatFields ? (
              // Chat form metrics
              <>
                <Card className="p-4">
                  <div className="flex items-center">
                    <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{chatAnalytics.totalSessions}</div>
                      <div className="text-sm text-gray-600">Chat Sessions</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <Bot className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{chatAnalytics.totalMessages}</div>
                      <div className="text-sm text-gray-600">Total Messages</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{chatAnalytics.avgMessagesPerSession}</div>
                      <div className="text-sm text-gray-600">Avg Messages/Session</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-orange-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{chatAnalytics.activeSessions}</div>
                      <div className="text-sm text-gray-600">Active (24h)</div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              // Traditional form metrics
              <>
                <Card className="p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{submissionAnalytics.totalSubmissions}</div>
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
                        {submissionAnalytics.chartData.reduce((sum, item) => sum + item.submissions, 0)}
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
                        {submissionAnalytics.lastSubmission 
                          ? new Date(submissionAnalytics.lastSubmission).toLocaleDateString()
                          : 'No submissions'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Last Submission</div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Additional metrics for chat forms */}
          {hasChatFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-600">{chatAnalytics.authenticatedSessions}</div>
                    <div className="text-sm text-gray-600">Authenticated Sessions</div>
                  </div>
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-600">{chatAnalytics.anonymousSessions}</div>
                    <div className="text-sm text-gray-600">Anonymous Sessions</div>
                  </div>
                  <UserX className="w-6 h-6 text-gray-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{chatAnalytics.sessionsWithMessages}</div>
                    <div className="text-sm text-gray-600">Sessions with Messages</div>
                  </div>
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </Card>
            </div>
          )}

          {/* Trend Chart */}
          {hasChatFields ? (
            // Chat sessions trend
            chatAnalytics.sessionChartData.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Chat Sessions Trend (Last 7 Days)</h3>
                <ChartContainer
                  config={{
                    sessions: {
                      label: "Sessions",
                      color: "#8884d8",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chatAnalytics.sessionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sessions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Card>
            )
          ) : (
            // Submission trend
            submissionAnalytics.chartData.length > 0 && (
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
                    <BarChart data={submissionAnalytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="submissions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Card>
            )
          )}

          {/* Field completion rates for traditional forms */}
          {!hasChatFields && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Field Completion Rates</h3>
              <div className="space-y-3">
                {submissionAnalytics.fieldStats.map((stat, index) => (
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
          )}
        </TabsContent>

        {hasChatFields ? (
          <>
            <TabsContent value="chat-sessions" className="space-y-6">
              {loadingChatSessions ? (
                <Card className="p-8 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
                  <div className="text-gray-500">Loading chat sessions...</div>
                </Card>
              ) : chatSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Chat Sessions Yet</h3>
                  <p className="text-gray-500">When users interact with your chat form, their sessions will appear here.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Session Statistics */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Session Overview</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {chatSessions.filter(s => s.userId).length}
                        </div>
                        <div className="text-sm text-gray-600">Authenticated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {chatSessions.filter(s => !s.userId).length}
                        </div>
                        <div className="text-sm text-gray-600">Anonymous</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {chatSessions.filter(s => s.totalMessages > 0).length}
                        </div>
                        <div className="text-sm text-gray-600">With Messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {chatSessions.filter(s => {
                            const hoursSinceActivity = (Date.now() - s.lastActivity.getTime()) / (1000 * 60 * 60);
                            return hoursSinceActivity < 1;
                          }).length}
                        </div>
                        <div className="text-sm text-gray-600">Active (1h)</div>
                      </div>
                    </div>
                  </Card>

                  {/* Sessions Table */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">All Chat Sessions ({chatSessions.length})</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session ID</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Messages</TableHead>
                          <TableHead>User Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chatSessions
                          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
                          .map((session) => {
                            const isRecent = (Date.now() - session.lastActivity.getTime()) < (1000 * 60 * 60); // 1 hour
                            const hasMessages = session.totalMessages > 0;
                            
                            return (
                              <TableRow 
                                key={session.id} 
                                className={`cursor-pointer hover:bg-gray-50 ${hasMessages ? '' : 'opacity-60'}`}
                                onClick={() => hasMessages && setSelectedChatSession(session)}
                              >
                                <TableCell className="font-mono text-sm">
                                  {session.id.slice(0, 8).toUpperCase()}
                                  {!hasMessages && (
                                    <div className="text-xs text-gray-400">No messages</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{session.createdAt.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">{session.createdAt.toLocaleTimeString()}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{session.lastActivity.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">{session.lastActivity.toLocaleTimeString()}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={hasMessages ? "default" : "secondary"}>
                                    {session.totalMessages}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={session.userId ? "default" : "secondary"}>
                                    {session.userId ? "Authenticated" : "Anonymous"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={isRecent ? "default" : "secondary"}>
                                    {isRecent ? "Recent" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {hasMessages ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedChatSession(session);
                                      }}
                                    >
                                      View Chat
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-gray-400">No transcript</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transcripts" className="space-y-6">
              {selectedChatSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Chat Transcript - Session {selectedChatSession.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedChatSession.totalMessages} messages • 
                        Created {selectedChatSession.createdAt.toLocaleString()} • 
                        {selectedChatSession.userId ? 'Authenticated User' : 'Anonymous User'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedChatSession(null)}
                    >
                      Back to Sessions
                    </Button>
                  </div>

                  <Card className="p-6 max-h-96 overflow-y-auto">
                    {selectedChatSession.fullTranscript.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages in this session</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedChatSession.fullTranscript
                          .sort((a, b) => (a.messageIndex || 0) - (b.messageIndex || 0))
                          .map((message, index) => (
                          <div key={message.id || index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.type === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : message.type === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.type === 'user' ? 'User' : message.type === 'error' ? 'Error' : 'Bot'}
                                </span>
                                <span className="text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Session Details */}
                  <Card className="p-6">
                    <h4 className="text-md font-semibold mb-3">Session Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Session Key:</span>
                        <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                          {selectedChatSession.sessionKey}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Form Field ID:</span>
                        <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                          {selectedChatSession.formFieldId}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <div className="text-gray-600 mt-1">
                          {selectedChatSession.createdAt.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Last Activity:</span>
                        <div className="text-gray-600 mt-1">
                          {selectedChatSession.lastActivity.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Chat Session</h3>
                  <p className="text-gray-500 mb-4">
                    Go to the Chat Sessions tab and click on a session to view its transcript here.
                  </p>
                  {chatSessions.length > 0 && (
                    <Button 
                      onClick={() => {
                        const sessionWithMessages = chatSessions.find(s => s.totalMessages > 0);
                        if (sessionWithMessages) {
                          setSelectedChatSession(sessionWithMessages);
                        }
                      }}
                    >
                      {chatSessions.filter(s => s.totalMessages > 0).length > 0 ? 'View Latest Session' : 'No Sessions with Messages'}
                    </Button>
                  )}
                </Card>
              )}
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="entries" className="space-y-6">
              {form.submissions.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-500">When people submit your form, their responses will appear here.</p>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
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
                              <div className="text-xs text-gray-400">
                                ID: {submission.id.slice(0, 8).toUpperCase()}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {submission.submissionType || 'traditional'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {selectedSubmission ? 'Submission Details' : 'Select a Submission'}
                    </h3>
                    {selectedSubmission ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
                          <div><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                          <div><strong>Type:</strong> {selectedSubmission.submissionType || 'traditional'}</div>
                          <div><strong>IP:</strong> {selectedSubmission.ipAddress || 'Unknown'}</div>
                          {selectedSubmission.completionTimeSeconds && (
                            <div><strong>Completion Time:</strong> {selectedSubmission.completionTimeSeconds}s</div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {form.fields.filter(f => f.type !== 'chat' && f.type !== 'page-break').map((field) => {
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

            <TabsContent value="field-analysis" className="space-y-6">
              {submissionAnalytics.valueAnalytics.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Available</h3>
                  <p className="text-gray-500">
                    Field analytics are available for select and radio button fields with submissions.
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {submissionAnalytics.valueAnalytics.map((fieldAnalytic) => (
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
          </>
        )}

        <TabsContent value="fields" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Form Fields Overview</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Field Type</TableHead>
                  <TableHead>Required</TableHead>
                  {!hasChatFields && <TableHead>Completion Rate</TableHead>}
                  <TableHead>Field ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.fields.map((field) => {
                  const stat = submissionAnalytics.fieldStats.find(s => s.fieldName === field.label);
                  return (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {field.type === 'page-break' ? 'Page Break' : field.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={field.required ? "default" : "secondary"}>
                          {field.required ? "Required" : "Optional"}
                        </Badge>
                      </TableCell>
                      {!hasChatFields && (
                        <TableCell>
                          {stat ? (
                            <Badge variant={stat.completionRate >= 80 ? "default" : "secondary"}>
                              {stat.completionRate}%
                            </Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs text-gray-500">
                        {field.id}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Field Configuration Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Field Configuration Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {form.fields.filter(f => f.type !== 'chat' && f.type !== 'page-break').length}
                </div>
                <div className="text-sm text-gray-600">Traditional Fields</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {form.fields.filter(f => f.type === 'chat').length}
                </div>
                <div className="text-sm text-gray-600">Chat Fields</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {form.fields.filter(f => f.required).length}
                </div>
                <div className="text-sm text-gray-600">Required Fields</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {form.fields.filter(f => f.type === 'page-break').length}
                </div>
                <div className="text-sm text-gray-600">Page Breaks</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};