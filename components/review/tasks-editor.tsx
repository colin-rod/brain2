'use client';

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
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import type { TaskPriority } from '@/types/database';
import type { TaskDraft, PersonDraft } from '@/types/domain';

function getActioneeDisplayName(task: TaskDraft, people: PersonDraft[]): string | undefined {
  if (!task.actionee_person_id) return undefined;
  const person = people.find((p) => p.id === task.actionee_person_id);
  return person?.name || task.actionee_name || undefined;
}

export function TasksEditor() {
  const tasks = useReviewStore((s) => s.tasks);
  const people = useReviewStore((s) => s.people);
  const updateTask = useReviewStore((s) => s.updateTask);
  const removeTask = useReviewStore((s) => s.removeTask);

  return (
    <div className="space-y-north-sm">
      {tasks.length === 0 && <EditorEmptyMessage message="No tasks found — add one if needed." />}

      <div className="space-y-north-sm">
        {tasks.map((task) => (
          <EditorItemCard key={task.id} variant="subtle" className="animate-scale-in">
            {/* Row 1: title + remove */}
            <div className="flex items-center gap-north-sm">
              <Input
                aria-label="Task title"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                placeholder="Task title"
                maxLength={500}
                className="flex-1 min-w-40"
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove task"
                onClick={() => removeTask(task.id)}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Row 2: date + shortcuts */}
            <DateInputWithShortcuts
              aria-label="Due date"
              value={task.due_date || ''}
              onChange={(v) => updateTask(task.id, { due_date: v || null })}
              inline
            />

            {/* Row 2: actionee + priority */}
            <div className="flex gap-north-sm">
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
                  <SelectTrigger aria-label="Assignee">
                    {task.actionee_person_id ? (
                      <span>{getActioneeDisplayName(task, people) ?? 'Unassigned'}</span>
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
              <div className="w-32">
                <p className="text-metadata text-foreground-muted mb-north-xs">Priority</p>
                <Select
                  value={task.priority || 'none'}
                  onValueChange={(v) =>
                    updateTask(task.id, {
                      priority: v === 'none' ? null : (v as TaskPriority),
                    })
                  }
                >
                  <SelectTrigger aria-label="Priority">
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
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
