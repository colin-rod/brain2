'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';

export function IdeasEditor() {
  const ideas = useReviewStore((s) => s.ideas);
  const updateIdea = useReviewStore((s) => s.updateIdea);
  const removeIdea = useReviewStore((s) => s.removeIdea);

  return (
    <div className="space-y-north-sm">
      {ideas.length === 0 && <EditorEmptyMessage message="No ideas found — add one if needed." />}

      <div className="space-y-north-xs">
        {ideas.map((idea) => (
          <div key={idea.id} className="flex items-start gap-north-sm animate-scale-in">
            <Textarea
              aria-label="Idea"
              value={idea.idea_text}
              onChange={(e) => updateIdea(idea.id, { idea_text: e.target.value })}
              placeholder="Describe the idea or possibility..."
              maxLength={2000}
              rows={2}
              className="flex-1 resize-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeIdea(idea.id)}
              className="shrink-0 text-foreground-muted hover:text-destructive mt-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
