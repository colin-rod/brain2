'use client';

import { Input } from '@/components/ui/input';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';

export function DecisionsEditor() {
  const decisions = useReviewStore((s) => s.decisions);
  const updateDecision = useReviewStore((s) => s.updateDecision);
  const addDecision = useReviewStore((s) => s.addDecision);
  const removeDecision = useReviewStore((s) => s.removeDecision);

  return (
    <div className="space-y-north-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Decisions</h3>
        <Button variant="ghost" size="sm" onClick={addDecision} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {decisions.length === 0 && (
        <p className="text-metadata text-foreground-muted py-north-sm">No decisions extracted.</p>
      )}

      <div className="space-y-north-sm">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="rounded-md border border-border bg-surface-subtle p-north-md space-y-north-sm"
          >
            <div className="flex items-start gap-north-sm">
              <Textarea
                value={decision.decision_text}
                onChange={(e) => updateDecision(decision.id, { decision_text: e.target.value })}
                placeholder="What was decided?"
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
                <label className="text-metadata text-foreground-muted block mb-1">
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
                />
              </div>
              <div className="w-48">
                <label className="text-metadata text-foreground-muted block mb-1">Date</label>
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
          </div>
        ))}
      </div>
    </div>
  );
}
