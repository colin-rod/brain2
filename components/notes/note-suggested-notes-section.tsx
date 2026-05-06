'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Link2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findSimilarNotes } from '@/lib/actions/embeddings';
import { createNoteLink } from '@/lib/actions/note-links';
import type { SuggestedNoteLink } from '@/types/domain';

interface NoteSuggestedNotesSectionProps {
  noteId: string;
  onMutate: () => void;
}

export function NoteSuggestedNotesSection({ noteId, onMutate }: NoteSuggestedNotesSectionProps) {
  const [suggestions, setSuggestions] = useState<SuggestedNoteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    findSimilarNotes(noteId)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [noteId]);

  function handleApprove(suggestedNoteId: string) {
    setLinkingId(suggestedNoteId);
    startTransition(async () => {
      await createNoteLink(noteId, suggestedNoteId);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestedNoteId));
      setLinkingId(null);
      onMutate();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-north-sm text-metadata text-foreground-muted py-north-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding related notes...
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div>
      <h2 className="text-section-header mb-north-xs flex items-center gap-north-xs">
        <Sparkles className="h-4 w-4 text-foreground-muted" />
        Suggested Links
      </h2>
      <div className="space-y-north-xs">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-start gap-north-sm rounded-md border border-border border-dashed bg-surface-subtle px-north-md py-north-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-north-xs">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                <span className="text-issue-title truncate">{suggestion.title}</span>
                <span className="text-metadata text-foreground-muted shrink-0">
                  {Math.round(suggestion.similarity * 100)}%
                </span>
              </div>
              {suggestion.summary && (
                <p className="text-metadata text-foreground-secondary mt-north-xs line-clamp-2">
                  {suggestion.summary}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Link to ${suggestion.title}`}
              onClick={() => handleApprove(suggestion.id)}
              disabled={linkingId === suggestion.id}
              className="shrink-0 text-foreground-muted hover:text-primary"
            >
              {linkingId === suggestion.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
