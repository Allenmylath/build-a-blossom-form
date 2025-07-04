
import { FormField } from '@/types/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Download, Code, Share, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FormExportProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FormField[];
  formName: string;
}

export const FormExport = ({ isOpen, onClose, fields, formName }: FormExportProps) => {
  const generateJSON = () => {
    return JSON.stringify({ name: formName, fields }, null, 2);
  };

  const generateHTML = () => {
    const htmlFields = fields.map(field => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'url':
        case 'phone':
          return `    <div class="form-group">
      <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
      <input type="${field.type}" id="${field.id}" name="${field.id}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.required ? 'required' : ''}>
    </div>`;
        case 'textarea':
          return `    <div class="form-group">
      <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
      <textarea id="${field.id}" name="${field.id}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.required ? 'required' : ''}></textarea>
    </div>`;
        case 'select':
          return `    <div class="form-group">
      <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
      <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
        <option value="">${field.placeholder || 'Select an option'}</option>
        ${field.options?.map(option => `<option value="${option}">${option}</option>`).join('\n        ') || ''}
      </select>
    </div>`;
        case 'radio':
          return `    <div class="form-group">
      <fieldset>
        <legend>${field.label}${field.required ? ' *' : ''}</legend>
        ${field.options?.map((option, index) => 
          `<label><input type="radio" name="${field.id}" value="${option}" ${field.required && index === 0 ? 'required' : ''}> ${option}</label>`
        ).join('\n        ') || ''}
      </fieldset>
    </div>`;
        case 'checkbox':
          return `    <div class="form-group">
      <label><input type="checkbox" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}> ${field.label}${field.required ? ' *' : ''}</label>
    </div>`;
        case 'date':
          return `    <div class="form-group">
      <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
      <input type="date" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
    </div>`;
        case 'file':
          return `    <div class="form-group">
      <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
      <input type="file" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
    </div>`;
        default:
          return '';
      }
    }).join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formName}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        fieldset { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
        legend { font-weight: bold; }
    </style>
</head>
<body>
    <h1>${formName}</h1>
    <form method="POST" action="#" enctype="multipart/form-data">
${htmlFields}
        
        <button type="submit">Submit</button>
    </form>
</body>
</html>`;
  };

  const generateEmbedCode = () => {
    return `<iframe 
  src="YOUR_FORM_URL" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: 1px solid #ccc; border-radius: 8px;">
</iframe>`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${type} has been copied to your clipboard.`,
    });
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `${filename} has been downloaded.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-purple-600" />
            Export Form: {formName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="json" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">JSON Export</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export your form structure as JSON for importing into other systems.
              </p>
              <Textarea
                value={generateJSON()}
                readOnly
                className="font-mono text-sm"
                rows={12}
              />
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => copyToClipboard(generateJSON(), 'JSON')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => downloadFile(generateJSON(), `${formName.replace(/\s+/g, '_')}.json`, 'application/json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">HTML Export</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export as a complete HTML form ready to use on any website.
              </p>
              <Textarea
                value={generateHTML()}
                readOnly
                className="font-mono text-sm"
                rows={12}
              />
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => copyToClipboard(generateHTML(), 'HTML')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy HTML
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => downloadFile(generateHTML(), `${formName.replace(/\s+/g, '_')}.html`, 'text/html')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download HTML
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Embed Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use this iframe code to embed your form on any website.
              </p>
              <Textarea
                value={generateEmbedCode()}
                readOnly
                className="font-mono text-sm"
                rows={6}
              />
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => copyToClipboard(generateEmbedCode(), 'Embed Code')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Embed Code
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Share Form</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate a shareable link for your form.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Public Form URL</label>
                  <div className="flex mt-1">
                    <Input 
                      value={`${window.location.origin}/form/your-form-id`}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      className="ml-2"
                      onClick={() => copyToClipboard(`${window.location.origin}/form/your-form-id`, 'Form URL')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Share Options</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• Send the direct link to respondents</p>
                    <p>• Embed on your website using the iframe code</p>
                    <p>• Share on social media platforms</p>
                    <p>• Include in email campaigns</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
