'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ImageIcon,
  FileText,
  MessageSquare,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { parseCapture } from '@/lib/actions/parse';
import type { Capture, CaptureSourceType, CaptureStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const sourceIcons: Record<CaptureSourceType, typeof ImageIcon> = {
  image: ImageIcon,
  text: FileText,
  chat_transcript: MessageSquare,
};

const sourceLabels: Record<CaptureSourceType, string> = {
  image: 'Image',
  text: 'Text',
  chat_transcript: 'Chat',
};

const statusStyles: Record<CaptureStatus, string> = {
  new: 'bg-status-new/15 text-status-new border-status-new/30',
  processing: 'bg-status-processing/15 text-status-processing border-status-processing/30',
  ocr_complete: 'bg-status-parsed/15 text-status-parsed border-status-parsed/30',
  parsed: 'bg-status-parsed/15 text-status-parsed border-status-parsed/30',
  in_review: 'bg-status-in-review/15 text-status-in-review border-status-in-review/30',
  saved: 'bg-status-saved/15 text-status-saved border-status-saved/30',
  failed: 'bg-status-failed/15 text-status-failed border-status-failed/30',
};

const statusLabels: Record<CaptureStatus, string> = {
  new: 'New',
  processing: 'Processing',
  ocr_complete: 'OCR Done',
  parsed: 'Parsed',
  in_review: 'In Review',
  saved: 'Saved',
  failed: 'Failed',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getPreviewText(capture: Capture): string {
  if (capture.raw_text) {
    return capture.raw_text.slice(0, 120) + (capture.raw_text.length > 120 ? '...' : '');
  }
  if (capture.source_type === 'image') {
    return 'Image capture';
  }
  return 'No preview';
}

interface CaptureListProps {
  captures: Capture[];
}

export function CaptureList({ captures }: CaptureListProps) {
  if (captures.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-north-xl text-center">
        <FileText className="mx-auto h-10 w-10 text-foreground-muted mb-north-sm" />
        <p className="text-body text-foreground-secondary">No captures yet</p>
        <p className="text-metadata text-foreground-muted mt-1">
          Upload an image or paste text above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-north-xs">
      {captures.map((capture) => (
        <CaptureCard key={capture.id} capture={capture} />
      ))}
    </div>
  );
}

function CaptureCard({ capture }: { capture: Capture }) {
  const router = useRouter();
  const [isParsing, startTransition] = useTransition();
  const Icon = sourceIcons[capture.source_type];
  const isClickable = capture.status === 'parsed' || capture.status === 'in_review';
  const canParse = capture.status === 'new' || capture.status === 'failed';

  function handleParse(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await parseCapture(capture.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Parsed successfully');
        router.refresh();
      }
    });
  }

  const content = (
    <div
      className={cn(
        'flex items-center gap-north-md rounded-lg border border-border bg-surface px-north-base py-north-md transition-colors',
        isClickable && 'hover:bg-surface-subtle cursor-pointer',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-subtle">
        <Icon className="h-5 w-5 text-foreground-secondary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-north-sm mb-0.5">
          <span className="text-metadata text-foreground-secondary">
            {sourceLabels[capture.source_type]}
          </span>
          <Badge
            variant="outline"
            className={cn('text-[11px] px-1.5 py-0', statusStyles[capture.status])}
          >
            {statusLabels[capture.status]}
          </Badge>
        </div>
        <p className="text-body text-foreground truncate">{getPreviewText(capture)}</p>
        {capture.status === 'failed' && capture.error_message && (
          <p className="text-metadata text-status-failed mt-0.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {capture.error_message.slice(0, 80)}
          </p>
        )}
        <p className="text-metadata text-foreground-muted mt-0.5">
          {formatRelativeTime(capture.created_at)}
        </p>
      </div>

      {canParse && (
        <Button
          size="sm"
          variant={capture.status === 'failed' ? 'outline' : 'default'}
          onClick={handleParse}
          disabled={isParsing}
          className="shrink-0"
        >
          {isParsing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : capture.status === 'failed' ? (
            <>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Parse
            </>
          )}
        </Button>
      )}

      {capture.status === 'processing' && (
        <Loader2 className="h-4 w-4 shrink-0 text-status-processing animate-spin" />
      )}

      {isClickable && <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />}
    </div>
  );

  if (isClickable) {
    return <Link href={`/review/${capture.id}`}>{content}</Link>;
  }

  return content;
}
