'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';

export function QuestionsEditor() {
  const questions = useReviewStore((s) => s.open_questions);
  const updateQuestion = useReviewStore((s) => s.updateQuestion);
  const addQuestion = useReviewStore((s) => s.addQuestion);
  const removeQuestion = useReviewStore((s) => s.removeQuestion);

  return (
    <div className="space-y-north-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Open Questions</h3>
        <Button variant="ghost" size="sm" onClick={addQuestion} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-metadata text-foreground-muted py-north-sm">
          No open questions extracted.
        </p>
      )}

      <div className="space-y-north-xs">
        {questions.map((q) => (
          <div key={q.id} className="flex items-center gap-north-sm">
            <Input
              value={q.question_text}
              onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
              placeholder="What needs to be resolved?"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(q.id)}
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
