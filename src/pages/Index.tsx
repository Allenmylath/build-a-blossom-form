
import { FormBuilder } from '@/components/FormBuilder';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Form Builder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create beautiful, interactive forms with our intuitive drag-and-drop builder. 
            Add fields, customize properties, and see your form come to life in real-time.
          </p>
        </div>
        <FormBuilder />
      </div>
    </div>
  );
};

export default Index;
