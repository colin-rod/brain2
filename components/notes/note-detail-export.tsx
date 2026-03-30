'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { exportNoteMarkdown, downloadNoteMarkdown } from '@/lib/actions/export';

interface NoteDetailExportProps {
  noteId: string;
  hasExport: boolean;
}

export function NoteDetailExport({ noteId, hasExport }: NoteDetailExportProps) {
  const router = useRouter();
  const [isExporting, startExport] = useTransition();
  const [isDownloading, startDownload] = useTransition();

  function handleExport() {
    startExport(async () => {
      const result = await exportNoteMarkdown(noteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Markdown exported');
        router.refresh();
      }
    });
  }

  function handleDownload() {
    startDownload(async () => {
      const result = await downloadNoteMarkdown(noteId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.markdown) return;

      const blob = new Blob([result.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex items-center gap-north-sm">
      {hasExport && (
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1.5" />
          )}
          Download
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        )}
        {hasExport ? 'Regenerate' : 'Export MD'}
      </Button>
    </div>
  );
}
