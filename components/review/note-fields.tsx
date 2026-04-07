'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useReviewStore } from '@/lib/stores/review-store';

export function NoteFields() {
  const title = useReviewStore((s) => s.title);
  const summary = useReviewStore((s) => s.summary);
  const cleaned_text = useReviewStore((s) => s.cleaned_text);
  const setTitle = useReviewStore((s) => s.setTitle);
  const setSummary = useReviewStore((s) => s.setSummary);
  const setCleanedText = useReviewStore((s) => s.setCleanedText);

  return (
    <div className="space-y-north-base">
      <div>
        <label
          htmlFor="title"
          className="text-metadata text-foreground-secondary block mb-north-xs"
        >
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="text-issue-title"
        />
      </div>

      <div>
        <label
          htmlFor="summary"
          className="text-metadata text-foreground-secondary block mb-north-xs"
        >
          Summary
        </label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary of the note..."
          rows={3}
          className="resize-y"
        />
      </div>

      <div>
        <label
          htmlFor="cleaned-text"
          className="text-metadata text-foreground-secondary block mb-north-xs"
        >
          Full Notes
        </label>
        <Textarea
          id="cleaned-text"
          value={cleaned_text}
          onChange={(e) => setCleanedText(e.target.value)}
          placeholder="Full content of the note..."
          rows={8}
          className="resize-y"
        />
      </div>
    </div>
  );
}
