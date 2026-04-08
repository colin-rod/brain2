import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { ExportsActions } from '@/components/exports/exports-actions';
import { Download, FileText } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { Note } from '@/types/database';

export default async function ExportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notes')
    .select('id, title, markdown_path, created_at')
    .not('markdown_path', 'is', null)
    .order('created_at', { ascending: false });

  const notes = (data ?? []) as Pick<Note, 'id' | 'title' | 'markdown_path' | 'created_at'>[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Exports" description="Download or regenerate markdown exports." />

      {notes.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No exports yet"
          description="Exports are generated automatically when you save a note."
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <div className="space-y-north-xs">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-north-base py-north-md"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/notes/${note.id}`}
                  className="flex items-center gap-north-sm hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 shrink-0 text-foreground-secondary" />
                  <span className="text-body font-medium truncate">{note.title}</span>
                </Link>
                <p className="text-metadata text-foreground-muted mt-0.5">
                  {formatDate(note.created_at)}
                </p>
              </div>
              <ExportsActions noteId={note.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
