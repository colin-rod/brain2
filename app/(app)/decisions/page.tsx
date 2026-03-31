import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Scale } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { Decision } from '@/types/database';

export default async function DecisionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('decisions')
    .select('*, notes(id, title)')
    .order('created_at', { ascending: false });

  const decisions = (data ?? []) as (Decision & { notes: { id: string; title: string } | null })[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Decisions" description="All decisions extracted from your notes." />

      {decisions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No decisions yet"
          description="Decisions appear here after you save notes that contain them."
        />
      ) : (
        <div className="space-y-north-sm">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-border bg-surface px-north-base py-north-md"
            >
              <p className="text-body">{d.decision_text}</p>
              {d.rationale && (
                <p className="text-metadata text-foreground-secondary mt-north-xs">
                  Rationale: {d.rationale}
                </p>
              )}
              <div className="flex items-center gap-north-md mt-north-xs">
                {d.decision_date && (
                  <span className="text-metadata text-foreground-muted">
                    {formatDate(d.decision_date)}
                  </span>
                )}
                {d.notes && (
                  <Link
                    href={`/notes/${d.notes.id}`}
                    className="text-metadata text-primary hover:underline"
                  >
                    {d.notes.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
