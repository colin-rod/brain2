'use client';

import { Input } from '@/components/ui/input';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';

export function DecisionsEditor() {
  const decisions = useReviewStore((s) => s.decisions);
  const updateDecision = useReviewStore((s) => s.updateDecision);
  const removeDecision = useReviewStore((s) => s.removeDecision);

  return (
    <div className="space-y-north-sm">
      {decisions.length === 0 && (
        <EditorEmptyMessage message="No decisions found — add one if needed." />
      )}

      <div className="space-y-north-sm">
        {decisions.map((decision) => (
          <EditorItemCard key={decision.id} variant="subtle" className="animate-scale-in">
            <div className="flex items-start gap-north-sm">
              <Textarea
                value={decision.decision_text}
                onChange={(e) => updateDecision(decision.id, { decision_text: e.target.value })}
                placeholder="What was decided?"
                maxLength={2000}
                rows={2}
                className="flex-1 resize-y"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDecision(decision.id)}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-north-sm">
              <div className="flex-1">
                <label className="text-metadata text-foreground-muted block mb-north-xs">
                  Rationale (optional)
                </label>
                <Input
                  value={decision.rationale || ''}
                  onChange={(e) =>
                    updateDecision(decision.id, {
                      rationale: e.target.value || null,
                    })
                  }
                  placeholder="Why was this decided?"
                  maxLength={1000}
                />
              </div>
              <div className="w-48">
                <label className="text-metadata text-foreground-muted block mb-north-xs">
                  Date
                </label>
                <DateInputWithShortcuts
                  value={decision.decision_date || ''}
                  onChange={(v) =>
                    updateDecision(decision.id, {
                      decision_date: v || null,
                    })
                  }
                />
              </div>
            </div>
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
