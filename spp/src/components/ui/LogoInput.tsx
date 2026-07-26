import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');
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

    // Convert to Base64 data URL for local instant preview and saving
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
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-semibold text-obsidian mb-2">{label}</label>}

      {/* Tab Selector */}
      <div className="flex rounded-xl bg-slate/10 p-1 sm:p-1.5 mb-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 min-h-[38px] sm:min-h-[42px]",
            activeTab === 'url' ? "bg-white text-emerald-primary shadow-sm scale-[1.01]" : "text-slate-dark hover:text-obsidian hover:bg-white/40"
          )}
        >
          <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Copas URL Gambar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 min-h-[38px] sm:min-h-[42px]",
            activeTab === 'upload' ? "bg-white text-emerald-primary shadow-sm scale-[1.01]" : "text-slate-dark hover:text-obsidian hover:bg-white/40"
          )}
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Upload File Lokal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {/* Input Area */}
        <div className="sm:col-span-2">
          {activeTab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/logo-sekolah.png"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setPreviewError(false);
                }}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate/20 focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
              />
              <Button type="submit" variant="primary" size="sm">
                Terapkan
              </Button>
            </form>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 bg-white/50",
                isDragging ? "border-emerald-primary bg-emerald-light/40" : "border-slate/30 hover:border-emerald-primary/60"
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
              <Upload className="w-8 h-8 text-emerald-primary mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-obsidian">Klik untuk pilih atau drag & drop file</p>
              <p className="text-xs text-slate mt-1">PNG, JPG, WebP, SVG (Maks 2MB)</p>
            </div>
          )}
          {helpText && <p className="text-xs text-slate mt-2">{helpText}</p>}
        </div>

        {/* Live Preview Card */}
        <div className="sm:col-span-1 bg-white/80 border border-slate/15 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs min-h-[110px]">
          <span className="text-xs font-semibold text-slate uppercase tracking-wider mb-2 block">Live Preview</span>
          {value && !previewError ? (
            <div className="relative group">
              <img
                src={value}
                alt="Logo Preview"
                className="w-16 h-16 object-contain mx-auto rounded-lg bg-ivory p-1 border border-slate/10 shadow-2xs"
                onError={() => setPreviewError(true)}
              />
              <div className="flex items-center justify-center gap-1 mt-2 text-[11px] font-medium text-emerald-primary">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Siap Dipakai</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-light flex flex-col items-center py-2">
              {previewError ? (
                <>
                  <AlertCircle className="w-8 h-8 text-rose-danger mb-1" />
                  <span className="text-xs text-rose-danger font-medium">Gambar tak muat</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-xs">Belum ada gambar</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
