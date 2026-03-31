'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateInputWithShortcuts } from '@/components/ui/date-input-with-shortcuts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InlineEditableText } from './inline-editable-text';
import { CheckSquare, Plus, X } from 'lucide-react';
import { updateTask, addTask, deleteTask } from '@/lib/actions/note-mutations';
import type { Task, TaskPriority, TaskStatus } from '@/types/database';

interface NoteTasksSectionProps {
  noteId: string;
  tasks: Task[];
  onMutate: () => void;
}

export function NoteTasksSection({ noteId, tasks, onMutate }: NoteTasksSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setIsAdding(true);
  }

  function handleAddSave(title: string) {
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await addTask(noteId, { title });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  function handleFieldUpdate(
    taskId: string,
    updates: Partial<Pick<Task, 'due_date' | 'priority' | 'status'>>,
  ) {
    startTransition(async () => {
      const result = await updateTask(taskId, updates);
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
            <CheckSquare className="h-4 w-4" />
            Tasks ({tasks.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <div className="space-y-north-xs">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-md border border-border bg-surface px-north-md py-north-sm"
            >
              <div className="flex items-center justify-between gap-north-sm">
                <div className="flex-1">
                  <InlineEditableText
                    value={task.title}
                    onSave={async (v) => updateTask(task.id, { title: v })}
                    className="text-body"
                  />
                </div>
                <div className="flex items-center gap-north-sm shrink-0">
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleFieldUpdate(task.id, { status: v as TaskStatus })}
                  >
                    <SelectTrigger className="w-28 h-7 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    disabled={isPending}
                    className="shrink-0 text-foreground-muted hover:text-destructive h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-north-sm mt-north-xs">
                <Select
                  value={task.priority || 'none'}
                  onValueChange={(v) =>
                    handleFieldUpdate(task.id, {
                      priority: v === 'none' ? null : (v as TaskPriority),
                    })
                  }
                >
                  <SelectTrigger className="w-20 h-7 text-[12px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="P0">P0</SelectItem>
                    <SelectItem value="P1">P1</SelectItem>
                    <SelectItem value="P2">P2</SelectItem>
                    <SelectItem value="P3">P3</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-40">
                  <DateInputWithShortcuts
                    value={task.due_date || ''}
                    onChange={(v) => handleFieldUpdate(task.id, { due_date: v || null })}
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
                placeholder="New task title..."
                className="text-body"
              />
            </div>
          )}
        </div>
        {tasks.length === 0 && !isAdding && (
          <p className="text-metadata text-foreground-muted py-north-sm">No tasks.</p>
        )}
      </div>
    </>
  );
}
