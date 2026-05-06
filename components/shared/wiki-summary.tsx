'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateWikiSummary } from '@/lib/actions/generate-wiki-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/format-date';

interface WikiSummaryProps {
  summary: string | null;
  generatedAt: string | null;
  entityType: 'person' | 'project' | 'domain';
  entityId: string;
}

export function WikiSummary({ summary, generatedAt, entityType, entityId }: WikiSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auto-generate if no cached summary
  useEffect(() => {
    if (!summary && !isPending) {
      startTransition(async () => {
        const result = await generateWikiSummary(entityType, entityId);
        if (result.error) {
          toast.error(`Failed to generate summary: ${result.error}`);
        }
        router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRegenerate() {
    startTransition(async () => {
      const result = await generateWikiSummary(entityType, entityId, true);
      if (result.error) {
        toast.error(`Failed to generate summary: ${result.error}`);
      }
      router.refresh();
    });
  }

  if (isPending || (!summary && !generatedAt)) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading summary"
        className="rounded-lg border border-border border-l-[3px] border-l-primary bg-surface-subtle px-north-base py-north-md space-y-north-sm"
      >
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <p className="text-metadata text-foreground-muted animate-pulse">Compiling summary...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-lg border border-border border-l-[3px] border-l-primary bg-surface-subtle px-north-base py-north-md">
      <h2 className="sr-only">Summary</h2>
      <div className="text-body whitespace-pre-line">{summary}</div>
      <div className="mt-north-sm flex items-center justify-between">
        <p className="text-metadata text-foreground-muted">
          {generatedAt && `Generated ${formatDate(generatedAt)}`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={isPending}
          className="relative touch-target text-foreground-muted hover:text-foreground gap-1 h-7"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
