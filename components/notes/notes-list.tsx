'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { SearchBar } from '@/components/shared/search-bar';
import { formatDate } from '@/lib/format-date';
import type { Note } from '@/types/database';

export function NotesList({ notes }: { notes: Note[] }) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(
    () => new Fuse(notes, { keys: ['title', 'summary'], threshold: 0.4, ignoreLocation: true }),
    [notes],
  );

  const filtered = query.length >= 2 ? fuse.search(query).map((r) => r.item) : notes;

  return (
    <div className="space-y-north-md">
      <SearchBar placeholder="Filter notes..." onSearch={setQuery} />

      <div className="space-y-north-xs">
        {filtered.map((note) => (
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
              {formatDate(note.created_at)}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && query.length >= 2 && (
          <p className="text-body text-foreground-muted text-center py-north-lg">
            No notes match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
