import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

export interface LogoInputProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  className?: string;
}

export const LogoInput: React.FC<LogoInputProps> = ({
  value,
  onChange,
  label = 'Logo / Gambar Sekolah',
  helpText = 'Upload file lokal (drag & drop) atau copas URL gambar eksternal langsung!',
  className,
}) => {
  const [urlInput, setUrlInput] = useState(value || '');
  const [isDragging, setIsDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (urlInput.trim()) {
      setPreviewError(false);
      onChange(urlInput.trim());
    }
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setPreviewError(false);
        onChange(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <Label className="mb-2">{label}</Label>}

      <Tabs defaultValue="url" className="mb-3">
        <TabsList className="w-full bg-muted">
          <TabsTrigger value="url" className="flex-1 gap-1.5">
            <LinkIcon className="h-4 w-4" />
            <span className="truncate">Copas URL Gambar</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 gap-1.5">
            <Upload className="h-4 w-4" />
            <span className="truncate">Upload File Lokal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/logo-sekolah.png"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setPreviewError(false);
                  }}
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="sm">
                  Terapkan
                </Button>
              </form>
              {helpText && <p className="text-xs text-muted-foreground mt-2">{helpText}</p>}
            </div>
            <LogoPreview value={value} previewError={previewError} />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'sm:col-span-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 bg-background',
                isDragging ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/60'
              )}
              onClick={() => document.getElementById('logo-file-input')?.click()}
            >
              <input
                id="logo-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <Upload className="mx-auto mb-2 h-8 w-8 text-primary opacity-80" />
              <p className="text-sm font-semibold text-foreground">Klik untuk pilih atau drag & drop file</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, SVG (Maks 2MB)</p>
            </div>
            <LogoPreview value={value} previewError={previewError} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const LogoPreview: React.FC<{ value?: string; previewError: boolean }> = ({ value, previewError }) => {
  const [failed, setFailed] = React.useState(previewError);
  React.useEffect(() => setFailed(previewError), [previewError]);

  return (
    <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl border bg-card p-3 text-center shadow-sm">
      <span className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Live Preview
      </span>
      {value && !failed ? (
        <div className="relative">
          <img
            src={value}
            alt="Logo Preview"
            className="mx-auto h-16 w-16 rounded-lg border bg-muted p-1 object-contain"
            onError={() => setFailed(true)}
          />
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-primary">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Siap Dipakai</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-2 text-muted-foreground">
          {failed ? (
            <>
              <AlertCircle className="mb-1 h-8 w-8 text-destructive" />
              <span className="text-xs font-medium text-destructive">Gambar tak muat</span>
            </>
          ) : (
            <>
              <ImageIcon className="mb-1 h-8 w-8 opacity-50" />
              <span className="text-xs">Belum ada gambar</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
