
import { useAppStore } from '@/store';
import { FormBuilder } from './FormBuilder';
import { Auth } from './Auth';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export const FormBuilderWithAuth = () => {
  // Use completely stable selectors with primitive values only
  const isAuthenticated = useAppStore(state => !!state.user);
  const authLoading = useAppStore(state => state.authLoading);
  const isStable = useAppStore(state => state.isStable);
  const user = useAppStore(state => state.user);

  console.log('FormBuilderWithAuth render:', { 
    isAuthenticated, 
    authLoading, 
    isStable 
  });

  // Simple placeholder function - auth state is managed by the store
  const handleAuthChange = () => {
    console.log('Auth change placeholder called');
  };

  if (authLoading || !isStable) {
    console.log('FormBuilderWithAuth showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('FormBuilderWithAuth showing auth page');
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

          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-md">
              <Auth onAuthChange={handleAuthChange} />
            </div>
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

  console.log('FormBuilderWithAuth rendering FormBuilder');
  return <FormBuilder user={user} />;
};
