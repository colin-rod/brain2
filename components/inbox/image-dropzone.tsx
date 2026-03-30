'use client';

import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function ImageDropzone({ file, onFileChange }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (f: File) => {
      onFileChange(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    },
    [onFileChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) {
        handleFile(f);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        handleFile(f);
      }
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFileChange(null);
  }, [preview, onFileChange]);

  if (file && preview) {
    return (
      <div className="relative rounded-md border border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1.5 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-center p-north-base">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Upload preview" className="max-h-64 rounded object-contain" />
        </div>
        <div className="border-t border-border px-north-md py-north-sm text-metadata text-foreground-secondary truncate">
          <ImageIcon className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          {file.name}
        </div>
      </div>
    );
  }

  return (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex flex-col items-center justify-center gap-north-sm rounded-md border-2 border-dashed p-north-xl cursor-pointer transition-colors',
        isDragging
          ? 'border-primary bg-primary-tint'
          : 'border-border hover:border-foreground-muted hover:bg-surface-subtle',
      )}
    >
      <Upload className="h-8 w-8 text-foreground-muted" />
      <div className="text-center">
        <p className="text-body font-medium">Drop an image here or click to browse</p>
        <p className="text-metadata text-foreground-muted mt-1">PNG, JPG, HEIC up to 10MB</p>
      </div>
      <input type="file" accept="image/*" onChange={handleInputChange} className="sr-only" />
    </label>
  );
}
