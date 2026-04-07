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
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import type { TaskPriority } from '@/types/database';

export function TasksEditor() {
  const tasks = useReviewStore((s) => s.tasks);
  const people = useReviewStore((s) => s.people);
  const updateTask = useReviewStore((s) => s.updateTask);
  const addTask = useReviewStore((s) => s.addTask);
  const removeTask = useReviewStore((s) => s.removeTask);

  return (
    <div className="space-y-north-sm">
      <EditorSectionHeader title="Tasks" onAdd={addTask} />

      {tasks.length === 0 && <EditorEmptyMessage message="No tasks found — add one if needed." />}

      <div className="space-y-north-sm">
        {tasks.map((task) => (
          <EditorItemCard key={task.id} variant="subtle">
            <div className="flex items-start gap-north-sm">
              <Input
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                placeholder="Task title"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTask(task.id)}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-north-sm">
              <div className="flex-1">
                <label className="text-metadata text-foreground-muted block mb-1">Due date</label>
                <DateInputWithShortcuts
                  value={task.due_date || ''}
                  onChange={(v) => updateTask(task.id, { due_date: v || null })}
                />
              </div>
              <div className="w-32">
                <label className="text-metadata text-foreground-muted block mb-1">Priority</label>
                <Select
                  value={task.priority || 'none'}
                  onValueChange={(v) =>
                    updateTask(task.id, {
                      priority: v === 'none' ? null : (v as TaskPriority),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="P0">P0</SelectItem>
                    <SelectItem value="P1">P1</SelectItem>
                    <SelectItem value="P2">P2</SelectItem>
                    <SelectItem value="P3">P3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-metadata text-foreground-muted block mb-1">Actionee</label>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
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
            </div>
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
