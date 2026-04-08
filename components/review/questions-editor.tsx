'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';

export function QuestionsEditor() {
  const questions = useReviewStore((s) => s.open_questions);
  const updateQuestion = useReviewStore((s) => s.updateQuestion);
  const addQuestion = useReviewStore((s) => s.addQuestion);
  const removeQuestion = useReviewStore((s) => s.removeQuestion);

  return (
    <div className="space-y-north-sm">
      <EditorSectionHeader title="Open Questions" onAdd={addQuestion} />

      {questions.length === 0 && (
        <EditorEmptyMessage message="No open questions found — add one if needed." />
      )}

      <div className="space-y-north-xs">
        {questions.map((q) => (
          <div key={q.id} className="flex items-center gap-north-sm">
            <Input
              aria-label="Question"
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
