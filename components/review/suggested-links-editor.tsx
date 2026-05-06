'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2, Loader2 } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { findSimilarNotesForText } from '@/lib/actions/embeddings';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import { cn } from '@/lib/utils';

export function SuggestedLinksEditor() {
  const title = useReviewStore((s) => s.title);
  const summary = useReviewStore((s) => s.summary);
  const cleanedText = useReviewStore((s) => s.cleaned_text);
  const suggestedNoteLinks = useReviewStore((s) => s.suggestedNoteLinks);
  const approvedNoteLinkIds = useReviewStore((s) => s.approvedNoteLinkIds);
  const setSuggestedNoteLinks = useReviewStore((s) => s.setSuggestedNoteLinks);
  const toggleNoteLinkApproval = useReviewStore((s) => s.toggleNoteLinkApproval);

  const [done, setDone] = useState(false);
  const fetchingRef = useRef(false);

  const hasContent = !!(title || summary || cleanedText);
  const loading = hasContent && !done && suggestedNoteLinks.length === 0;

  // Fetch suggestions once when the component mounts and we have content
  useEffect(() => {
    if (fetchingRef.current || suggestedNoteLinks.length > 0) return;
    const text = [title, summary, cleanedText].filter(Boolean).join('\n\n');
    if (!text.trim()) return;

    fetchingRef.current = true;

    let cancelled = false;
    findSimilarNotesForText(text)
      .then((links) => {
        if (!cancelled) setSuggestedNoteLinks(links);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [title, summary, cleanedText, suggestedNoteLinks.length, setSuggestedNoteLinks]);

  if (loading) {
    return (
      <div className="flex items-center gap-north-sm text-metadata text-foreground-muted py-north-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding related notes...
      </div>
    );
  }

  if (suggestedNoteLinks.length === 0) {
    return <EditorEmptyMessage message="No related notes found." />;
  }

  return (
    <div className="space-y-north-xs">
      {suggestedNoteLinks.map((link) => {
        const isApproved = approvedNoteLinkIds.includes(link.id);
        return (
          <EditorItemCard key={link.id} className="animate-scale-in">
            <button
              type="button"
              onClick={() => toggleNoteLinkApproval(link.id)}
              className={cn(
                'flex items-start gap-north-sm w-full text-left transition-colors',
                isApproved && 'bg-primary-tint/10',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  isApproved ? 'border-primary bg-primary text-white' : 'border-border bg-surface',
                )}
              >
                {isApproved && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-north-xs">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                  <span className="text-issue-title truncate">{link.title}</span>
                  <span className="text-metadata text-foreground-muted shrink-0">
                    {Math.round(link.similarity * 100)}%
                  </span>
                </div>
                {link.summary && (
                  <p className="text-metadata text-foreground-secondary mt-north-xs line-clamp-2">
                    {link.summary}
                  </p>
                )}
              </div>
            </button>
          </EditorItemCard>
        );
      })}
    </div>
  );
}
