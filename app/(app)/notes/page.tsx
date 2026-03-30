import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FileText } from 'lucide-react';
import type { Note } from '@/types/database';

export default async function NotesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  const notes = (data ?? []) as Note[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Notes" description="Browse all saved notes." />

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Notes appear here after you save a reviewed capture."
        />
      ) : (
        <div className="space-y-north-xs">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="block rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle transition-colors"
            >
              <p className="text-issue-title text-foreground">{note.title}</p>
              {note.summary && (
                <p className="text-body text-foreground-secondary mt-0.5 line-clamp-2">
                  {note.summary}
                </p>
              )}
              <p className="text-metadata text-foreground-muted mt-north-xs">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
