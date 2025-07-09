
import { SavedForm } from '@/types/form';
import { User } from '@supabase/supabase-js';

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

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {user.email}
          </p>
        </div>
        <div className="text-right">
          {isHobbyPlan && (
            <p className="text-sm text-green-600 font-medium">
              Hobby Plan: {savedFormsCount}/5 forms used
            </p>
          )}
          {currentForm && (
            <div className="mt-1">
              <h2 className="font-semibold text-gray-900 text-sm">{currentForm.name}</h2>
              <p className="text-xs text-gray-500">
                Last updated: {currentForm.updatedAt.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
