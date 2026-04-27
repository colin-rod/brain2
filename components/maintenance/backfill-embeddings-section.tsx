'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  backfillEntityEmbeddings,
  type EntityBackfillResult,
} from '@/lib/actions/backfill-embeddings';

export function BackfillEmbeddingsSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EntityBackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await backfillEntityEmbeddings();
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Backfill failed');
      }
    });
  };

  return (
    <section>
      <h2 className="text-section-header mb-north-sm flex items-center gap-north-xs">
        <Sparkles className="h-4 w-4" />
        Semantic Search Index
      </h2>
      <p className="text-metadata text-foreground-muted mb-north-md">
        Generate embeddings for people and projects so they appear in &ldquo;Related by
        meaning&rdquo; results. Idempotent — safe to re-run.
      </p>

      <div className="rounded-lg border border-border bg-surface px-north-base py-north-md flex items-center justify-between gap-north-md">
        <div className="text-body">
          {isPending && 'Backfilling embeddings…'}
          {!isPending && !result && !error && 'Click to backfill missing embeddings.'}
          {!isPending && result && (
            <span>
              Embedded <strong>{result.peopleEmbedded}</strong> people,{' '}
              <strong>{result.projectsEmbedded}</strong> projects.{' '}
              {result.summariesGenerated > 0 && (
                <>
                  Generated <strong>{result.summariesGenerated}</strong> new summaries.{' '}
                </>
              )}
              {result.errors > 0 && (
                <span className="text-status-failed">
                  {result.errors} error{result.errors === 1 ? '' : 's'}.
                </span>
              )}
            </span>
          )}
          {!isPending && error && <span className="text-status-failed">{error}</span>}
        </div>
        <Button onClick={run} disabled={isPending} variant="default">
          {isPending ? 'Running…' : 'Backfill embeddings'}
        </Button>
      </div>
    </section>
  );
}
