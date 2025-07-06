
import { Button } from '@/components/ui/button';
import { SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface FormBuilderHeaderProps {
  user: User;
  currentForm: SavedForm | null;
  savedFormsCount: number;
  isHobbyPlan: boolean;
}

export const FormBuilderHeader = ({ 
  user, 
  currentForm, 
  savedFormsCount, 
  isHobbyPlan 
}: FormBuilderHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 border-b border-green-200 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Form Builder</h1>
          <p className="text-gray-700">Welcome back, {user.email}</p>
          {isHobbyPlan && (
            <p className="text-sm text-green-700 font-medium">
              Hobby Plan: {savedFormsCount}/5 forms used
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentForm && (
            <div className="text-right mr-4">
              <h2 className="font-semibold text-black">{currentForm.name}</h2>
              <p className="text-sm text-gray-600">
                Last updated: {currentForm.updatedAt.toLocaleDateString()}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="flex items-center border-green-300 text-green-700 hover:bg-green-50"
          >
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
