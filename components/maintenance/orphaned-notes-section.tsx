'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { OrphanedNote } from '@/lib/actions/maintenance';

interface OrphanedNotesSectionProps {
  notes: OrphanedNote[];
}

export function OrphanedNotesSection({ notes }: OrphanedNotesSectionProps) {
  return (
    <section>
      <h2 className="text-section-header mb-north-sm flex items-center gap-north-xs">
        Orphaned Notes
        <span className="inline-flex items-center justify-center rounded-full bg-status-new/15 text-status-new text-metadata px-2 py-0.5">
          {notes.length}
        </span>
      </h2>
      <p className="text-metadata text-foreground-muted mb-north-md">
        Notes with no linked people, projects, or domains.
      </p>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-border border-dashed bg-surface-subtle px-north-lg py-north-xl text-center">
          <p className="text-body text-foreground-muted">All notes are connected. Nice work.</p>
        </div>
      ) : (
        <div className="space-y-north-xs">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex items-start gap-north-sm rounded-lg border border-border bg-surface px-north-base py-north-md hover:border-primary/40 hover:bg-sidebar-accent/20 transition-colors"
            >
              <FileText className="h-4 w-4 shrink-0 mt-0.5 text-foreground-secondary" />
              <div className="min-w-0 flex-1">
                <span className="text-issue-title truncate block">{note.title}</span>
                {note.summary && (
                  <p className="text-metadata text-foreground-secondary mt-north-xs line-clamp-2">
                    {note.summary}
                  </p>
                )}
                <p className="text-metadata text-foreground-muted mt-north-xs">
                  {formatDate(note.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
