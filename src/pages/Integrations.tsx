import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, ArrowLeft, Link, Zap, Mail, Database } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Integrations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseAuth();
  const { isConnected: calendarConnected, calendarEmail, loading: calendarLoading, setIsConnected: setCalendarConnected, setCalendarEmail } = useCalendarIntegration(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user just connected calendar
    if (searchParams.get('calendar_connected') === 'true') {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected!",
      });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/integrations');
      setCalendarConnected(true);
    }

    // Check for calendar connection errors
    const calendarError = searchParams.get('calendar_error');
    if (calendarError) {
      toast({
        title: "Calendar Connection Failed",
        description: `Error: ${calendarError}`,
        variant: "destructive",
      });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, setCalendarConnected]);

  const handleConnectGoogleCalendar = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('Initiating calendar connection for user:', user.id);
      
      // Call your Edge Function to get the auth URL
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { 
          action: 'auth', 
          user_id: user.id,
          app_origin: window.location.origin
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.authUrl) {
        console.log('Redirecting to Google auth:', data.authUrl);
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned from Edge Function');
      }
    } catch (error) {
      console.error('Calendar connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect your Google Calendar. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Disconnecting calendar for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { 
          action: 'disconnect', 
          user_id: user.id 
        }
      });

      if (error) {
        console.error('Disconnect error:', error);
        throw error;
      }

      setCalendarConnected(false);
      setCalendarEmail(null);
      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    } catch (error) {
      console.error('Calendar disconnection error:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect your Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Connect your Google Calendar for appointment booking',
      icon: Calendar,
      connected: calendarConnected,
      connectedEmail: calendarEmail,
      onConnect: handleConnectGoogleCalendar,
      onDisconnect: handleDisconnectGoogleCalendar,
      loading: loading || calendarLoading,
      color: 'blue',
      howItWorks: [
        'Forms can include appointment booking fields',
        'Users can select available time slots',
        'Appointments are automatically added to your calendar',
        'Email confirmations are sent to both parties'
      ]
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automate workflows with thousands of apps',
      icon: Zap,
      connected: false,
      connectedEmail: null,
      onConnect: () => {
        toast({
          title: "Coming Soon",
          description: "Zapier integration will be available soon!",
        });
      },
      onDisconnect: () => {},
      loading: false,
      color: 'orange',
      howItWorks: [
        'Trigger automated workflows when forms are submitted',
        'Connect to 5000+ apps and services',
        'Sync data with CRMs, email tools, and databases',
        'Create custom automation chains'
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send form submissions to Slack channels',
      icon: Mail,
      connected: false,
      connectedEmail: null,
      onConnect: () => {
        toast({
          title: "Coming Soon",
          description: "Slack integration will be available soon!",
        });
      },
      onDisconnect: () => {},
      loading: false,
      color: 'purple',
      howItWorks: [
        'Get instant notifications in Slack channels',
        'Format submissions as rich messages',
        'Direct message team members about urgent submissions',
        'Create custom notification rules'
      ]
    },
    {
      id: 'webhooks',
      name: 'Custom Webhooks',
      description: 'Send data to your custom endpoints',
      icon: Database,
      connected: false,
      connectedEmail: null,
      onConnect: () => {
        toast({
          title: "Coming Soon",
          description: "Custom webhooks will be available soon!",
        });
      },
      onDisconnect: () => {},
      loading: false,
      color: 'green',
      howItWorks: [
        'Send form submissions to any HTTP endpoint',
        'Custom payload formatting',
        'Retry logic for failed requests',
        'Real-time or batched delivery options'
      ]
    }
  ];

  const getColorClasses = (color: string, connected: boolean) => {
    const colors = {
      blue: connected ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-blue-600',
      orange: connected ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-orange-600',
      purple: connected ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-purple-600',
      green: connected ? 'text-green-600 bg-green-50 border-green-200' : 'text-green-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
            <p className="text-gray-600">Connect external services to enhance your form functionality</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <integration.icon className={`w-8 h-8 ${getColorClasses(integration.color, false)}`} />
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {integration.connected && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {integration.connected ? (
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 ${getColorClasses(integration.color, true)}`}>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Connected</span>
                      </div>
                      <p className="text-sm mt-1">
                        {integration.connectedEmail 
                          ? `Connected as ${integration.connectedEmail}` 
                          : `${integration.name} is connected and ready to use.`
                        }
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={integration.onDisconnect}
                      className="w-full"
                      disabled={integration.loading}
                    >
                      Disconnect {integration.name}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={integration.onConnect}
                      disabled={integration.loading}
                      className="w-full"
                    >
                      {integration.loading ? "Connecting..." : `Connect ${integration.name}`}
                    </Button>
                  </div>
                )}
                
                <div className={`text-sm rounded-lg p-4 ${getColorClasses(integration.color, true).replace('text-', 'bg-').replace('-600', '-50').replace('bg-', 'bg-').replace('-50', '-50 border border-').replace('border border-', 'border-')}`}>
                  <h4 className="font-medium mb-2 text-gray-900">How it works:</h4>
                  <ul className="space-y-1 text-gray-700">
                    {integration.howItWorks.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="p-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Link className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Need a custom integration?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              We're always adding new integrations. Let us know what service you'd like to connect with your forms.
            </p>
            <Button variant="outline">
              Request Integration
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Integrations;