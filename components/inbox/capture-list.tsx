'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { Inbox as InboxIcon, Sparkles, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import { parseCapture } from '@/lib/actions/parse';
import type { Capture, CaptureSourceType, CaptureStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const sourceShort: Record<CaptureSourceType, string> = {
  image: 'IMG',
  text: 'TXT',
  chat_transcript: 'CHT',
  voice: 'VOX',
  email: 'EML',
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
  ocr_complete: 'Extracted',
  parsed: 'Ready to review',
  in_review: 'In review',
  saved: 'Saved',
  failed: 'Failed',
};

const statusDotColor: Record<CaptureStatus, string> = {
  new: 'var(--color-status-new)',
  processing: 'var(--color-status-processing)',
  ocr_complete: 'var(--color-status-parsed)',
  parsed: 'var(--color-status-parsed)',
  in_review: 'var(--color-status-in-review)',
  saved: 'var(--color-status-saved)',
  failed: 'var(--color-status-failed)',
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
  return formatDate(date);
}

function getPreviewText(capture: Capture): string {
  if (capture.raw_text) {
    return capture.raw_text.slice(0, 120) + (capture.raw_text.length > 120 ? '...' : '');
  }
  if (capture.source_type === 'image') {
    return 'Image uploaded';
  }
  if (capture.source_type === 'voice') {
    return capture.ocr_text
      ? capture.ocr_text.slice(0, 120) + (capture.ocr_text.length > 120 ? '...' : '')
      : 'Voice note recorded';
  }
  return 'No content preview';
}

interface CaptureListProps {
  captures: Capture[];
}

export function CaptureList({ captures }: CaptureListProps) {
  if (captures.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="Nothing pending"
        description="Drop an image or paste text above — Brain2 will find what matters."
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {captures.map((capture, index) => (
        <CaptureCard key={capture.id} capture={capture} index={index} />
      ))}
    </div>
  );
}

const PROCESSING_MESSAGES = [
  'Extracting tasks...',
  'Identifying people...',
  'Reading between the lines...',
  'Connecting the dots...',
  'Finding what matters...',
];

const ProcessingIndicator = React.memo(function ProcessingIndicator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PROCESSING_MESSAGES.length), 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-north-sm shrink-0">
      <Loader2 className="h-4 w-4 text-status-processing animate-spin" />
      <span key={index} className="text-metadata text-status-processing animate-fade-in">
        {PROCESSING_MESSAGES[index]}
      </span>
    </div>
  );
});

const CaptureCard = React.memo(function CaptureCard({
  capture,
  index,
}: {
  capture: Capture;
  index: number;
}) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isParsing, startTransition] = useTransition();
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
        toast.success('Ready for you.');
        router.refresh();
        refreshSearch();
      }
    });
  }

  const content = (
    <div
      className={cn(
        'flex items-center gap-north-md px-north-sm py-north-xs rounded-none border-l-2 border-transparent transition-all duration-150',
        isClickable &&
          'hover:border-primary hover:bg-surface-subtle hover:shadow-level-1 cursor-pointer',
        isParsing && 'bg-surface-subtle/50',
      )}
    >
      <div className="flex flex-col items-center shrink-0 w-8 gap-0.5">
        <span className="font-mono text-label tabular-nums text-foreground-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            capture.status === 'processing' && 'animate-pulse-dot',
          )}
          style={{ backgroundColor: statusDotColor[capture.status] }}
        />
        <span className="font-mono text-label uppercase text-foreground-muted opacity-60">
          {sourceShort[capture.source_type]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-north-sm mb-north-xs">
          <Badge
            key={capture.status}
            variant="outline"
            className={cn(
              'text-label px-north-xs py-px rounded-none uppercase font-mono tracking-wider animate-scale-in transition-colors duration-300',
              statusStyles[capture.status],
            )}
          >
            {statusLabels[capture.status]}
          </Badge>
        </div>
        <p className="text-body text-foreground font-medium truncate">{getPreviewText(capture)}</p>
        {capture.status === 'failed' && capture.error_message && (
          <p className="text-metadata text-status-failed mt-north-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            {capture.error_message.slice(0, 80)}
          </p>
        )}
        <p className="font-mono text-label tabular-nums text-foreground-muted/70 mt-north-xs">
          {formatRelativeTime(capture.created_at)}
        </p>
      </div>

      {canParse && (
        <Button
          size="sm"
          variant={capture.status === 'failed' ? 'outline' : 'default'}
          onClick={handleParse}
          disabled={isParsing}
          className="shrink-0 active:scale-[0.97] transition-all duration-150"
        >
          {isParsing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : capture.status === 'failed' ? (
            <>
              <RotateCcw className="h-3.5 w-3.5 mr-north-xs" />
              Retry
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-north-xs" />
              Analyze
            </>
          )}
        </Button>
      )}

      {capture.status === 'processing' && <ProcessingIndicator />}
    </div>
  );

  const wrapped = isClickable ? <Link href={`/review/${capture.id}`}>{content}</Link> : content;

  return (
    <div
      className="animate-slide-in-up"
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      {wrapped}
    </div>
  );
});
