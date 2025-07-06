
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface KnowledgeBaseUploadProps {
  user: User;
  onUploadComplete: () => void;
}

export const KnowledgeBaseUpload = ({ user, onUploadComplete }: KnowledgeBaseUploadProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a PDF file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-bases')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Failed",
          description: "Failed to upload the PDF file.",
          variant: "destructive",
        });
        return;
      }

      // Save knowledge base record
      const { error: dbError } = await supabase
        .from('knowledge_bases')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          file_path: filePath,
          file_size: file.size,
          token_count: 0, // Will be updated after processing
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file
        await supabase.storage
          .from('knowledge-bases')
          .remove([filePath]);
        
        toast({
          title: "Save Failed",
          description: "Failed to save knowledge base information.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Knowledge base uploaded successfully!",
      });

      // Reset form
      setName('');
      setDescription('');
      setFile(null);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading knowledge base:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter knowledge base name"
            disabled={uploading}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            disabled={uploading}
          />
        </div>

        <div>
          <Label htmlFor="file">PDF File *</Label>
          <div className="mt-2">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <Label htmlFor="file" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Click to select a PDF file
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Maximum file size: 5MB
                    </p>
                  </div>
                )}
              </div>
            </Label>
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !file || !name.trim()}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Knowledge Base'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
