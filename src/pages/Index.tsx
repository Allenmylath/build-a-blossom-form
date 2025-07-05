
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilder } from '@/components/FormBuilder';
import { Auth } from '@/components/Auth';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Settings from './Settings';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleSignOut = () => {
    setUser(null);
    setShowSettings(false);
  };

  // Check if we should show settings page
  const currentPath = window.location.pathname;
  if (currentPath === '/settings' && user) {
    return <Settings user={user} onSignOut={handleSignOut} />;
  }

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
              <h3 className="font-sembiold mb-2">Cloud Storage</h3>
              <p className="text-sm text-gray-600">Save your forms securely in the cloud and access them anywhere</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <FormBuilder user={user} />;
};

export default Index;
