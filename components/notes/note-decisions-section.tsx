'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import { Separator } from '@/components/ui/separator';
import { InlineEditableText } from './inline-editable-text';
import { Scale, X } from 'lucide-react';
import { updateDecision, addDecision, deleteDecision } from '@/lib/actions/note-mutations';
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
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
        <EditorSectionHeader
          title="Decisions"
          onAdd={() => setIsAdding(true)}
          icon={Scale}
          count={decisions.length}
        />
        <div className="space-y-north-sm">
          {decisions.map((d) => (
            <EditorItemCard key={d.id}>
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
                  size="icon-sm"
                  onClick={() => handleDelete(d.id)}
                  disabled={isPending}
                  className="shrink-0 text-foreground-muted hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-north-xs">
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
              <div className="mt-north-xs">
                <DateInputWithShortcuts
                  value={d.decision_date || ''}
                  onChange={(v) => handleDateChange(d.id, v)}
                  inline
                />
              </div>
            </EditorItemCard>
          ))}
          {isAdding && (
            <EditorItemCard>
              <InlineEditableText
                value=""
                onSave={async (v) => {
                  handleAddSave(v);
                  return {};
                }}
                placeholder="What was decided?"
                className="text-body"
              />
            </EditorItemCard>
          )}
        </div>
        {decisions.length === 0 && !isAdding && <EditorEmptyMessage message="No decisions." />}
      </div>
    </>
  );
}
