'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import { Separator } from '@/components/ui/separator';
import { InlineEditableText } from './inline-editable-text';
import { Scale, Plus, X } from 'lucide-react';
import { updateDecision, addDecision, deleteDecision } from '@/lib/actions/note-mutations';
import type { Decision } from '@/types/database';

interface NoteDecisionsSectionProps {
  noteId: string;
  decisions: Decision[];
  onMutate: () => void;
}

export function NoteDecisionsSection({ noteId, decisions, onMutate }: NoteDecisionsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddSave(text: string) {
    if (!text.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await addDecision(noteId, { decision_text: text });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(decisionId: string) {
    startTransition(async () => {
      const result = await deleteDecision(decisionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  function handleDateChange(decisionId: string, date: string) {
    startTransition(async () => {
      const result = await updateDecision(decisionId, {
        decision_date: date || null,
      });
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
            <Scale className="h-4 w-4" />
            Decisions ({decisions.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <div className="space-y-north-sm">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="rounded-md border border-border bg-surface px-north-md py-north-sm"
            >
              <div className="flex items-start justify-between gap-north-sm">
                <div className="flex-1">
                  <InlineEditableText
                    value={d.decision_text}
                    onSave={async (v) => {
                      const result = await updateDecision(d.id, { decision_text: v });
                      if (!result.error) onMutate();
                      return result;
                    }}
                    className="text-body"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(d.id)}
                  disabled={isPending}
                  className="shrink-0 text-foreground-muted hover:text-destructive h-7 w-7 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-north-sm mt-north-xs">
                <div className="flex-1">
                  <InlineEditableText
                    value={d.rationale || ''}
                    onSave={async (v) => {
                      const result = await updateDecision(d.id, {
                        rationale: v || null,
                      });
                      if (!result.error) onMutate();
                      return result;
                    }}
                    placeholder="Rationale..."
                    className="text-metadata text-foreground-secondary"
                  />
                </div>
                <div className="w-40 shrink-0">
                  <DateInputWithShortcuts
                    value={d.decision_date || ''}
                    onChange={(v) => handleDateChange(d.id, v)}
                  />
                </div>
              </div>
            </div>
          ))}
          {isAdding && (
            <div className="rounded-md border border-border bg-surface px-north-md py-north-sm">
              <InlineEditableText
                value=""
                onSave={async (v) => {
                  handleAddSave(v);
                  return {};
                }}
                placeholder="What was decided?"
                className="text-body"
              />
            </div>
          )}
        </div>
        {decisions.length === 0 && !isAdding && (
          <p className="text-metadata text-foreground-muted py-north-sm">No decisions.</p>
        )}
      </div>
    </>
  );
}
