
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilder } from '@/components/FormBuilder';
import { Auth } from '@/components/Auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (newUser: User | null) => {
    setUser(newUser);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Advanced Form Builder
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create beautiful, interactive forms with drag-and-drop simplicity
            </p>
          </div>

          <div className="mb-8">
            <Auth onAuthChange={handleAuthChange} />
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Beautiful Design</h3>
              <p className="text-sm text-gray-600">Create stunning forms with our modern, responsive design system</p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Powerful Features</h3>
              <p className="text-sm text-gray-600">Multi-page forms, validation, chat integration, and much more</p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl mb-3">☁️</div>
              <h3 className="font-semibold mb-2">Cloud Storage</h3>
              <p className="text-sm text-gray-600">Save your forms securely in the cloud and access them anywhere</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header with logout button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Plus className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Form Builder</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <FormBuilder user={user} />
    </div>
  );
};

export default Index;
