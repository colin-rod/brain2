'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type FuseType from 'fuse.js';
import { SearchBar } from '@/components/shared/search-bar';
import { formatDate } from '@/lib/format-date';
import type { Note } from '@/types/database';

export function NotesList({ notes }: { notes: Note[] }) {
  const [query, setQuery] = useState('');
  const fuseRef = useRef<FuseType<Note> | null>(null);

  useEffect(() => {
    if (query.length < 2) return;
    import('fuse.js').then(({ default: Fuse }) => {
      fuseRef.current = new Fuse(notes, {
        keys: ['title', 'summary'],
        threshold: 0.4,
        ignoreLocation: true,
      });
    });
  }, [query.length >= 2, notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered =
    query.length >= 2 && fuseRef.current ? fuseRef.current.search(query).map((r) => r.item) : notes;

  return (
    <div className="space-y-north-md">
      <SearchBar placeholder="Filter notes..." onSearch={setQuery} />

      <div className="divide-y divide-border border-t border-border">
        {filtered.map((note, index) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="flex items-baseline gap-north-md px-north-sm py-north-xs hover:bg-surface-subtle transition-colors border-l-[3px] border-l-(--entity-notes) animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="font-mono text-[10px] text-foreground-muted tabular-nums shrink-0 w-6 text-right">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-issue-title text-foreground truncate flex-1">{note.title}</span>
            {note.summary && (
              <span className="hidden sm:block text-body text-foreground-secondary truncate flex-1">
                {note.summary}
              </span>
            )}
            <span className="font-mono text-[11px] tabular-nums text-foreground-muted shrink-0 ml-auto">
              {formatDate(note.created_at)}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && query.length >= 2 && (
          <p className="font-mono text-metadata text-foreground-muted uppercase tracking-wider pt-north-md border-t border-border">
            <span className="text-primary">{'// '}</span>NO RESULTS FOR &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
