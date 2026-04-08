'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageDropzone } from './image-dropzone';
import { createTextCapture, createImageCapture } from '@/lib/actions/capture';
import type { CaptureSourceType } from '@/types/database';
import { ImageIcon, FileText, MessageSquare, Loader2 } from 'lucide-react';

type InputMode = 'image' | 'text' | 'chat_transcript';

export function CaptureForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<InputMode>('image');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = !isPending && (mode === 'image' ? file !== null : text.trim().length > 0);

  function handleSubmit() {
    startTransition(async () => {
      let result;

      if (mode === 'image') {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        result = await createImageCapture(formData);
      } else {
        result = await createTextCapture(text, mode as CaptureSourceType);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Added to inbox');
      setText('');
      setFile(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-north-lg">
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as InputMode)}
        className="space-y-north-base"
      >
        <TabsList className="grid w-full grid-cols-3" aria-label="Capture input method">
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="h-4 w-4" />
            <span>Image</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Text</span>
          </TabsTrigger>
          <TabsTrigger value="chat_transcript" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image">
          <ImageDropzone file={file} onFileChange={setFile} />
        </TabsContent>

        <TabsContent value="text">
          <Textarea
            placeholder="Paste your notes, email content, or any text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="resize-y"
          />
        </TabsContent>

        <TabsContent value="chat_transcript">
          <Textarea
            placeholder="Paste a Google Chat or messaging thread here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="resize-y"
          />
        </TabsContent>
      </Tabs>

      <div className="mt-north-base flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add to Inbox
        </Button>
      </div>
    </div>
  );
}
