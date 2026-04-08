import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { NotesList } from '@/components/notes/notes-list';
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
      <PageHeader
        title="Notes"
        description="Browse all saved notes."
        icon={FileText}
        iconColor="var(--entity-notes)"
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Notes appear here after you save a reviewed capture."
          iconColor="var(--entity-notes)"
          bgColor="var(--entity-notes-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <NotesList notes={notes} />
      )}
    </div>
  );
}
