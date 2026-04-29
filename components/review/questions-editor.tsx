'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';

export function QuestionsEditor() {
  const questions = useReviewStore((s) => s.open_questions);
  const updateQuestion = useReviewStore((s) => s.updateQuestion);
  const removeQuestion = useReviewStore((s) => s.removeQuestion);

  return (
    <div className="space-y-north-sm">
      {questions.length === 0 && (
        <EditorEmptyMessage message="No open questions found — add one if needed." />
      )}

      <div className="space-y-north-xs">
        {questions.map((q) => (
          <EditorItemCard key={q.id} className="animate-scale-in">
            <div className="flex items-center gap-north-sm">
              <Input
                aria-label="Question"
                value={q.question_text}
                onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                placeholder="What needs to be resolved?"
                maxLength={1000}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove question"
                onClick={() => removeQuestion(q.id)}
                className="shrink-0 h-11 w-11 lg:h-8 lg:w-8 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
