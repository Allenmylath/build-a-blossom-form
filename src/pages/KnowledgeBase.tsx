
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';
import { KnowledgeBaseList } from '@/components/KnowledgeBaseList';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBases';
import { FileText, Upload, List, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface KnowledgeBaseProps {
  user: User;
}

const KnowledgeBase = ({ user }: KnowledgeBaseProps) => {
  const navigate = useNavigate();
  const { knowledgeBases, loading, fetchKnowledgeBases, deleteKnowledgeBase } = useKnowledgeBases(user);
  const [activeTab, setActiveTab] = useState('list');

  const handleUploadComplete = () => {
    fetchKnowledgeBases();
    setActiveTab('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      deleteKnowledgeBase(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              Knowledge Base
            </h1>
            <p className="text-gray-600">
              Upload and manage PDF documents for your chat forms
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>
              Knowledge bases enhance your chat forms with contextual information from PDF documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Upload className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">1. Upload PDFs</h3>
                <p className="text-gray-600">Upload PDF files up to 5MB in size</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">2. Link to Forms</h3>
                <p className="text-gray-600">Connect knowledge bases to your forms</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <List className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">3. Enhanced Chat</h3>
                <p className="text-gray-600">AI uses your documents to provide better responses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center">
              <List className="w-4 h-4 mr-2" />
              My Knowledge Bases ({knowledgeBases.length})
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600">Loading knowledge bases...</p>
                </CardContent>
              </Card>
            ) : (
              <KnowledgeBaseList 
                knowledgeBases={knowledgeBases}
                onDelete={handleDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <KnowledgeBaseUpload 
              user={user}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KnowledgeBase;
