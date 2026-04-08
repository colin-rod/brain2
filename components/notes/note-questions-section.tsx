'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InlineEditableText } from './inline-editable-text';
import { HelpCircle, Plus, X } from 'lucide-react';
import {
  updateOpenQuestion,
  addOpenQuestion,
  deleteOpenQuestion,
} from '@/lib/actions/note-mutations';
import type { OpenQuestion, QuestionStatus } from '@/types/database';

interface NoteQuestionsSectionProps {
  noteId: string;
  questions: OpenQuestion[];
  onMutate: () => void;
}

export function NoteQuestionsSection({ noteId, questions, onMutate }: NoteQuestionsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddSave(text: string) {
    if (!text.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await addOpenQuestion(noteId, { question_text: text });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(questionId: string) {
    startTransition(async () => {
      const result = await deleteOpenQuestion(questionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  function toggleStatus(questionId: string, currentStatus: QuestionStatus) {
    const newStatus: QuestionStatus = currentStatus === 'open' ? 'resolved' : 'open';
    startTransition(async () => {
      const result = await updateOpenQuestion(questionId, { status: newStatus });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  return (
    <>
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-north-md">
          <h2 className="text-section-header flex items-center gap-north-sm">
            <HelpCircle className="h-4 w-4" />
            Open Questions ({questions.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <ul className="space-y-north-xs">
          {questions.map((q) => (
            <li
              key={q.id}
              className="rounded-md border border-border bg-surface px-north-md py-north-sm flex items-center gap-north-sm"
            >
              <div className="flex-1">
                <InlineEditableText
                  value={q.question_text}
                  onSave={async (v) => {
                    const result = await updateOpenQuestion(q.id, { question_text: v });
                    if (!result.error) onMutate();
                    return result;
                  }}
                  className="text-body"
                />
              </div>
              <button
                type="button"
                onClick={() => toggleStatus(q.id, q.status)}
                disabled={isPending}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'text-label px-1.5 py-0.5 cursor-pointer',
                    q.status === 'resolved' &&
                      'bg-status-saved text-primary-foreground border-status-saved',
                  )}
                >
                  {q.status}
                </Badge>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(q.id)}
                disabled={isPending}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
          {isAdding && (
            <li className="rounded-md border border-border bg-surface px-north-md py-north-sm">
              <InlineEditableText
                value=""
                onSave={async (v) => {
                  handleAddSave(v);
                  return {};
                }}
                placeholder="What needs to be resolved?"
                className="text-body"
              />
            </li>
          )}
        </ul>
        {questions.length === 0 && !isAdding && (
          <p className="text-metadata text-foreground-muted py-north-sm">No open questions.</p>
        )}
      </div>
    </>
  );
}
