'use client';

import { type DragEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from './voice-recorder';
import { useSearchRefresh } from '@/components/search/search-provider';
import {
  createTextCapture,
  createImageCapture,
  createVoiceCapture,
  createPdfCapture,
} from '@/lib/actions/capture';
import type { CaptureSourceType } from '@/types/database';
import { detectTextType, type DetectedTextType } from '@/lib/inbox/heuristics';
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageSquare,
  Mic,
  Paperclip,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CaptureForm() {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [showCheck, setShowCheck] = useState(false);
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [detectedTextType, setDetectedTextType] = useState<DetectedTextType>('text');
  const [userOverrodeType, setUserOverrodeType] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [voiceStartToken, setVoiceStartToken] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const filePreviewUrl = useMemo(
    () => (attachedFile ? URL.createObjectURL(attachedFile) : null),
    [attachedFile],
  );

  useEffect(() => {
    if (!filePreviewUrl) return;
    return () => URL.revokeObjectURL(filePreviewUrl);
  }, [filePreviewUrl]);

  // Detect text type as user types/pastes (200ms debounce, skipped on manual override).
  useEffect(() => {
    if (userOverrodeType) return;
    const id = setTimeout(() => {
      setDetectedTextType(detectTextType(text));
    }, 200);
    return () => clearTimeout(id);
  }, [text, userOverrodeType]);

  function effectiveSourceType(): CaptureSourceType {
    if (attachedFile?.type.startsWith('image/')) return 'image';
    if (attachedFile?.type.startsWith('audio/')) return 'voice';
    if (attachedFile?.type === 'application/pdf') return 'pdf';
    return detectedTextType;
  }

  function acceptFile(f: File) {
    if (
      !f.type.startsWith('image/') &&
      !f.type.startsWith('audio/') &&
      f.type !== 'application/pdf'
    ) {
      toast.error('Only image, audio, or PDF files supported');
      return;
    }
    setAttachedFile(f);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  function handlePaperclipClick() {
    fileInputRef.current?.click();
  }

  function handleCameraClick() {
    cameraInputRef.current?.click();
  }

  function handleVoiceToolbarClick() {
    setVoiceStartToken((t) => t + 1);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = '';
  }

  function clearAttachedFile() {
    setAttachedFile(null);
  }

  function cycleType() {
    setUserOverrodeType(true);
    setDetectedTextType((t) =>
      t === 'email' ? 'chat_transcript' : t === 'chat_transcript' ? 'text' : 'email',
    );
  }

  const canSubmit = !isPending && !showCheck && (attachedFile !== null || text.trim().length > 0);

  function resetState() {
    setText('');
    setAttachedFile(null);
    setDetectedTextType('text');
    setUserOverrodeType(false);
  }

  function handleSubmit() {
    startTransition(async () => {
      const type = effectiveSourceType();
      let result;

      if (type === 'image' && attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        if (text.trim()) formData.append('rawText', text.trim());
        result = await createImageCapture(formData);
      } else if (type === 'voice' && attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        if (text.trim()) formData.append('rawText', text.trim());
        result = await createVoiceCapture(formData);
      } else if (type === 'pdf' && attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        if (text.trim()) formData.append('rawText', text.trim());
        result = await createPdfCapture(formData);
      } else {
        result = await createTextCapture(text, type);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Captured.');
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 1200);
      resetState();
      router.refresh();
      refreshSearch();
    });
  }

  const isImage = attachedFile?.type.startsWith('image/') ?? false;
  const isAudio = attachedFile?.type.startsWith('audio/') ?? false;
  const isPdf = attachedFile?.type === 'application/pdf';

  return (
    <div className="rounded-lg border border-border bg-surface p-north-base sm:p-north-lg shadow-level-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-md border border-border bg-background transition-colors',
          isDragOver && 'border-primary bg-primary-tint',
        )}
      >
        {attachedFile && filePreviewUrl ? (
          <div className="flex items-center gap-north-sm border-b border-border p-north-sm">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={filePreviewUrl}
                alt="Attachment preview"
                className="h-16 w-16 rounded object-cover"
              />
            ) : isAudio ? (
              <audio src={filePreviewUrl} controls className="h-10 flex-1" />
            ) : isPdf ? (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-surface-subtle text-foreground-muted">
                <FileText className="h-8 w-8" />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <div className="text-body font-medium truncate">{attachedFile.name}</div>
              <div className="text-metadata text-foreground-muted">
                {isImage ? 'Image' : isAudio ? 'Audio' : isPdf ? 'PDF' : 'File'}
              </div>
            </div>
            <button
              type="button"
              onClick={clearAttachedFile}
              aria-label="Remove attachment"
              className="inline-flex items-center justify-center rounded-full h-11 w-11 sm:h-8 sm:w-8 hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {!attachedFile ? (
          <div className="flex sm:hidden gap-north-sm border-b border-border p-north-sm">
            <button
              type="button"
              onClick={handleCameraClick}
              className="flex flex-1 min-h-11 flex-col items-center justify-center gap-1 rounded-md bg-surface-subtle text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span className="text-metadata">Camera</span>
            </button>
            <button
              type="button"
              onClick={handlePaperclipClick}
              className="flex flex-1 min-h-11 flex-col items-center justify-center gap-1 rounded-md bg-surface-subtle text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              <span className="text-metadata">Photo</span>
            </button>
            <button
              type="button"
              onClick={handleVoiceToolbarClick}
              className="flex flex-1 min-h-11 flex-col items-center justify-center gap-1 rounded-md bg-surface-subtle text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
              <span className="text-metadata">Voice</span>
            </button>
          </div>
        ) : null}

        <Textarea
          placeholder={
            attachedFile
              ? 'Add a note or context (optional)…'
              : 'Type, paste, or tap a button above…'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={50000}
          className="resize-y border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center rounded-md bg-primary-tint/80 text-body font-medium text-foreground">
            Drop image, audio, or PDF here
          </div>
        ) : null}
      </div>

      <div className="mt-north-base flex flex-col gap-north-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-north-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handlePaperclipClick}
            aria-label="Attach file"
            disabled={attachedFile !== null}
            className="inline-flex items-center justify-center rounded-full h-11 w-11 sm:h-9 sm:w-9 text-foreground-secondary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <VoiceRecorder
            file={attachedFile}
            onFileChange={setAttachedFile}
            compact
            autoStartToken={voiceStartToken}
          />
          {!attachedFile && text.trim().length > 0 ? (
            <button
              type="button"
              onClick={cycleType}
              aria-label="Detected type, tap to change"
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle px-3 py-2 sm:px-2 sm:py-0.5 text-metadata hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                detectedTextType === 'text' && 'hidden sm:inline-flex',
              )}
            >
              {detectedTextType === 'email' ? (
                <Mail className="h-4 w-4 sm:h-3 sm:w-3" />
              ) : detectedTextType === 'chat_transcript' ? (
                <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3" />
              ) : (
                <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3 opacity-60" />
              )}
              {detectedTextType === 'email'
                ? 'Email'
                : detectedTextType === 'chat_transcript'
                  ? 'Chat'
                  : 'Plain text'}
            </button>
          ) : null}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full sm:w-auto h-11 sm:h-9"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : showCheck ? (
            <svg
              className="mr-2 h-4 w-4 animate-check-draw text-current"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: 20 }}
              aria-hidden="true"
            >
              <polyline points="2,8 6,12 14,4" />
            </svg>
          ) : null}
          {isPending ? 'Capturing…' : showCheck ? 'Captured' : 'Capture'}
        </Button>
      </div>
    </div>
  );
}
