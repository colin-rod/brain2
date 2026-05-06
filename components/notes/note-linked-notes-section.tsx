'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { removeNoteLink } from '@/lib/actions/note-links';
import { formatDate } from '@/lib/format-date';
import type { Note } from '@/types/database';

interface NoteLinkedNotesSectionProps {
  noteId: string;
  linkedNotes: Pick<Note, 'id' | 'title' | 'summary' | 'created_at'>[];
  onMutate: () => void;
}

export function NoteLinkedNotesSection({
  noteId,
  linkedNotes,
  onMutate,
}: NoteLinkedNotesSectionProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (linkedNotes.length === 0) return null;

  function handleRemove(linkedNoteId: string) {
    setRemovingId(linkedNoteId);
    startTransition(async () => {
      await removeNoteLink(noteId, linkedNoteId);
      setRemovingId(null);
      onMutate();
    });
  }

  return (
    <div>
      <h2 className="text-section-header mb-north-xs flex items-center gap-north-xs">
        <Link2 className="h-4 w-4 text-foreground-muted" />
        Linked Notes
        <span className="text-metadata text-foreground-muted font-normal">
          ({linkedNotes.length})
        </span>
      </h2>
      <div className="space-y-north-xs">
        {linkedNotes.map((linked) => (
          <div
            key={linked.id}
            className="flex items-start gap-north-sm rounded-md border border-border bg-surface px-north-md py-north-sm"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/notes/${linked.id}`}
                className="text-issue-title hover:text-primary transition-colors truncate block"
              >
                {linked.title}
              </Link>
              {linked.summary && (
                <p className="text-metadata text-foreground-secondary mt-north-xs line-clamp-2">
                  {linked.summary}
                </p>
              )}
              <p className="text-metadata text-foreground-muted mt-north-xs">
                {formatDate(linked.created_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Unlink ${linked.title}`}
              onClick={() => handleRemove(linked.id)}
              disabled={removingId === linked.id}
              className="shrink-0 text-foreground-muted hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
