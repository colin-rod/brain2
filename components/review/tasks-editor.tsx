'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import { formatDate } from '@/lib/format-date';
import type { TaskPriority } from '@/types/database';
import type { TaskDraft, PersonDraft } from '@/types/domain';

function getActioneeDisplayName(task: TaskDraft, people: PersonDraft[]): string | undefined {
  if (!task.actionee_person_id) return undefined;
  const person = people.find((p) => p.id === task.actionee_person_id);
  return person?.name || task.actionee_name || undefined;
}

function TaskItem({ task }: { task: TaskDraft }) {
  const people = useReviewStore((s) => s.people);
  const updateTask = useReviewStore((s) => s.updateTask);
  const removeTask = useReviewStore((s) => s.removeTask);
  const [editingDetails, setEditingDetails] = useState(false);

  const assignee = getActioneeDisplayName(task, people);
  // Surface the parsed values as a compact, glanceable summary; only reveal the
  // full set of form controls when the user taps to edit them.
  const summaryBits = [
    task.due_date ? `Due ${formatDate(task.due_date)}` : null,
    assignee ? `@${assignee}` : null,
    task.priority ?? null,
  ].filter(Boolean) as string[];

  return (
    <EditorItemCard variant="subtle" className="animate-scale-in">
      {/* Row 1: title + remove */}
      <div className="flex items-center gap-north-sm">
        <Input
          aria-label="Task title"
          value={task.title}
          onChange={(e) => updateTask(task.id, { title: e.target.value })}
          placeholder="Task title"
          maxLength={500}
          className="flex-1 min-w-0 sm:min-w-40"
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove task"
          onClick={() => removeTask(task.id)}
          className="shrink-0 h-11 w-11 lg:h-8 lg:w-8 text-foreground-muted hover:text-destructive"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Row 2: compact summary (tap to edit) or full controls */}
      {editingDetails ? (
        <div className="space-y-north-sm">
          <DateInputWithShortcuts
            aria-label="Due date"
            value={task.due_date || ''}
            onChange={(v) => updateTask(task.id, { due_date: v || null })}
            inline
          />
          <div className="flex flex-col gap-north-sm sm:flex-row">
            <div className="flex-1">
              <p className="text-metadata text-foreground-muted mb-north-xs">Assigned to</p>
              <Select
                value={task.actionee_person_id || 'none'}
                onValueChange={(v) =>
                  updateTask(task.id, {
                    actionee_person_id: v === 'none' ? null : v,
                    actionee_name:
                      v === 'none' ? null : (people.find((p) => p.id === v)?.name ?? null),
                  })
                }
              >
                <SelectTrigger className="w-full" aria-label="Assignee">
                  {task.actionee_person_id ? (
                    <span>{assignee ?? 'Unassigned'}</span>
                  ) : (
                    <SelectValue placeholder="Unassigned" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || '(unnamed)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-32">
              <p className="text-metadata text-foreground-muted mb-north-xs">Priority</p>
              <Select
                value={task.priority || 'none'}
                onValueChange={(v) =>
                  updateTask(task.id, {
                    priority: v === 'none' ? null : (v as TaskPriority),
                  })
                }
              >
                <SelectTrigger className="w-full" aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="P0">P0 — Critical</SelectItem>
                  <SelectItem value="P1">P1 — High</SelectItem>
                  <SelectItem value="P2">P2 — Medium</SelectItem>
                  <SelectItem value="P3">P3 — Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDetails(true)}
          className="flex w-full items-center gap-north-sm min-h-11 lg:min-h-9 text-left text-metadata text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <span className="flex-1 min-w-0 truncate">
            {summaryBits.length > 0 ? (
              summaryBits.join(' · ')
            ) : (
              <span className="text-foreground-muted">No due date, assignee, or priority</span>
            )}
          </span>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
        </button>
      )}
    </EditorItemCard>
  );
}

export function TasksEditor() {
  const tasks = useReviewStore((s) => s.tasks);

  return (
    <div className="space-y-north-sm">
      {tasks.length === 0 && <EditorEmptyMessage message="No tasks found — add one if needed." />}

      <div className="space-y-north-sm">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
