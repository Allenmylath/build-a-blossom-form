import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, QrCode } from 'lucide-react';
import { SavedForm } from '@/types/form';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface QRCodeDialogProps {
  form: SavedForm | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeDialog = ({ form, isOpen, onClose }: QRCodeDialogProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async (url: string) => {
    try {
      setIsGenerating(true);
      const qrCodeUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (form && isOpen) {
      // Generate URL for the form
      const currentDomain = window.location.origin;
      const formUrl = `${currentDomain}/form/${form.id}`;
      generateQRCode(formUrl);
    }
  }, [form, isOpen]);

  const handleDownload = () => {
    if (!qrCodeDataUrl || !form) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${form.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your downloads.",
    });
  };

  const handleCopyUrl = () => {
    if (!form) return;

    const currentDomain = window.location.origin;
    const formUrl = `${currentDomain}/form/${form.id}`;
    
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "URL Copied",
      description: "Form URL has been copied to clipboard.",
    });
  };

  if (!form) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code for "{form.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {isGenerating ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt={`QR Code for ${form.name}`}
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                Failed to generate QR code
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Scan this QR code to access the form directly
            </p>
            <p className="text-xs text-muted-foreground break-all">
              {window.location.origin}/form/{form.id}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={!qrCodeDataUrl || isGenerating}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};