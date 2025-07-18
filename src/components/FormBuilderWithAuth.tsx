
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilder } from './FormBuilder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LogIn } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Link } from 'react-router-dom';

export const FormBuilderWithAuth = () => {
  const { user, loading } = useSupabaseAuth();

  const handleAuthChange = (newUser: User | null) => {
    // This will be handled by the useSupabaseAuth hook
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
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

          <div className="text-center mb-8">
            <Link to="/auth">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Get Started
              </Button>
            </Link>
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

  return <FormBuilder user={user} />;
};
