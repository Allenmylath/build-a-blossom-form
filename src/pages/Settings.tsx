
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, FileText, LogOut, Database, Calendar, Link, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {
  user: any;
  onSignOut: () => void;
}

const Settings = ({ user, onSignOut }: SettingsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      onSignOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePaymentDetails = () => {
    // Here you would integrate with your payment processor
    toast({
      title: "Payment Details Saved",
      description: "Your payment information has been updated successfully.",
    });
  };

  const handleConnectGoogleCalendar = async () => {
    setCalendarLoading(true);
    try {
      // This would integrate with Google Calendar API
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCalendarConnected(true);
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect your Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    setCalendarConnected(false);
    toast({
      title: "Calendar Disconnected",
      description: "Your Google Calendar has been disconnected.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Back to App
          </Button>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="logout" className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="plan">Current Plan</Label>
                  <Input 
                    id="plan" 
                    value="Hobby Plan" 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <Button onClick={() => navigate('/pricing')}>
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Manage your payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      placeholder="John Doe"
                      value={paymentDetails.cardholderName}
                      onChange={(e) => handlePaymentDetailsChange('cardholderName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentDetails.expiryDate}
                      onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentDetails.cvv}
                      onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSavePaymentDetails}>
                  Save Payment Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect external services to enhance your form functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">Google Calendar</h3>
                        <p className="text-gray-600 text-sm">
                          Connect your Google Calendar for appointment booking
                        </p>
                      </div>
                    </div>
                    {calendarConnected && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  
                  {calendarConnected ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-800 font-medium">Connected</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          Your Google Calendar is connected and ready for appointment booking.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleDisconnectGoogleCalendar}
                        className="w-full"
                      >
                        Disconnect Calendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm">
                        Connect your Google Calendar to enable appointment booking functionality. 
                        This will allow users to schedule meetings directly through your forms.
                      </p>
                      <Button 
                        onClick={handleConnectGoogleCalendar}
                        disabled={calendarLoading}
                        className="w-full"
                      >
                        {calendarLoading ? "Connecting..." : "Connect Google Calendar"}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Forms can include appointment booking fields</li>
                    <li>• Users can select available time slots</li>
                    <li>• Appointments are automatically added to your calendar</li>
                    <li>• Email confirmations are sent to both parties</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Management</CardTitle>
                <CardDescription>
                  Upload and manage PDF documents to enhance your chat forms with contextual information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Manage your knowledge bases to enhance chat forms
                  </p>
                  <Button onClick={() => navigate('/knowledge-base')}>
                    Go to Knowledge Base
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Upload PDF files (up to 5MB) to create knowledge bases that can be linked to your forms for enhanced AI responses.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logout">
            <Card>
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>
                  Sign out of your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to sign out? You'll need to sign in again to access your forms and settings.
                </p>
                <Button 
                  onClick={handleSignOut}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
