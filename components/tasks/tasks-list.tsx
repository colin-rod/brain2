'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { EntityCombobox } from '@/components/notes/entity-combobox';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterConfig } from '@/components/shared/filter-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { updateTask, deleteTask } from '@/lib/actions/note-mutations';
import { createStandaloneTask } from '@/lib/actions/entity-mutations';
import { formatDate } from '@/lib/format-date';
import { Plus, X } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, Person, Project } from '@/types/database';

type TaskWithRelations = Task & {
  notes: { id: string; title: string } | null;
  actionee: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

interface TasksListProps {
  tasks: TaskWithRelations[];
  allPeople: Pick<Person, 'id' | 'name'>[];
  allProjects: Pick<Project, 'id' | 'name'>[];
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
];

const PRIORITY_OPTIONS = [
  { value: 'P0', label: 'P0' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
];

export function TasksList({ tasks, allPeople, allProjects }: TasksListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { key: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS },
      {
        key: 'actionee',
        label: 'Assignee',
        type: 'select',
        options: allPeople.map((p) => ({ value: p.id, label: p.name })),
      },
      {
        key: 'project',
        label: 'Project',
        type: 'select',
        options: allProjects.map((p) => ({ value: p.id, label: p.name })),
      },
      { key: 'due_date', label: 'Due Date', type: 'date-range' },
    ],
    [allPeople, allProjects],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<TaskWithRelations>({
      items: tasks,
      searchKeys: ['title'],
    });

  const filtered = useMemo(() => {
    let result = searched;

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.actionee) {
      result = result.filter((t) => t.actionee_id === filters.actionee);
    }
    if (filters.project) {
      result = result.filter((t) => t.project_id === filters.project);
    }
    if (filters.due_date_from) {
      result = result.filter((t) => t.due_date && t.due_date >= filters.due_date_from);
    }
    if (filters.due_date_to) {
      result = result.filter((t) => t.due_date && t.due_date <= filters.due_date_to);
    }

    return applySorting(result, sort);
  }, [searched, filters, sort]);

  function handleFieldUpdate(taskId: string, updates: Record<string, unknown>) {
    startTransition(async () => {
      const result = await updateTask(taskId, updates as Parameters<typeof updateTask>[1]);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleCreate(title: string) {
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createStandaloneTask({ title });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
      setIsAdding(false);
    });
  }

  return (
    <div className="space-y-north-md">
      <div className="flex items-center justify-between">
        <SearchBar placeholder="Search tasks..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilter}
        onClear={clearFilters}
      />

      {/* Column headers */}
      <div className="hidden sm:grid sm:grid-cols-[24px_1fr_100px_60px_90px_100px_100px_32px] gap-north-sm px-north-sm items-center border-b-2 border-border pb-north-xs">
        <span className="font-mono text-[10px] text-foreground-muted uppercase">#</span>
        <SortableHeader label="Title" field="title" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Status" field="status" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Pri" field="priority" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Due" field="due_date" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Assignee" field="actionee" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Project" field="project" currentSort={sort} onSort={toggleSort} />
        <span />
      </div>

      <div className="divide-y divide-border border-t border-border">
        {isAdding && (
          <div className="border-l-2 border-primary px-north-sm py-north-xs">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="New task title... (Enter to save, Esc to cancel)"
              className="text-body"
            />
          </div>
        )}

        {filtered.map((task, index) => (
          <div
            key={task.id}
            className="px-north-sm py-north-xs border-l-[3px] border-l-(--entity-tasks)"
          >
            {/* Desktop: grid layout */}
            <div className="hidden sm:grid sm:grid-cols-[24px_1fr_100px_60px_90px_100px_100px_32px] gap-north-sm items-center">
              <span className="font-mono text-[10px] tabular-nums text-foreground-muted">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0">
                <InlineEditableText
                  value={task.title}
                  onSave={async (v) => {
                    const r = await updateTask(task.id, { title: v });
                    if (!r.error) router.refresh();
                    return r;
                  }}
                  className="text-body"
                />
                {task.notes && (
                  <Link
                    href={`/notes/${task.notes.id}`}
                    className="text-metadata text-primary hover:underline block mt-0.5"
                  >
                    {task.notes.title}
                  </Link>
                )}
              </div>

              <Select
                value={task.status}
                onValueChange={(v) => handleFieldUpdate(task.id, { status: v as TaskStatus })}
              >
                <SelectTrigger
                  size="sm"
                  className="text-label font-mono uppercase tracking-wider rounded-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={task.priority || 'none'}
                onValueChange={(v) =>
                  handleFieldUpdate(task.id, {
                    priority: v === 'none' ? null : (v as TaskPriority),
                  })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="text-label font-mono uppercase tracking-wider rounded-none"
                >
                  <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--</SelectItem>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={task.due_date || ''}
                onChange={(e) => handleFieldUpdate(task.id, { due_date: e.target.value || null })}
                className="h-7 text-label font-mono rounded-none"
              />

              {/* Assignee cell */}
              <div className="relative">
                {editingAssignee === task.id ? (
                  <EntityCombobox
                    items={allPeople}
                    excludeIds={[]}
                    onSelect={(item) => {
                      handleFieldUpdate(task.id, { actionee_id: item.id });
                      setEditingAssignee(null);
                    }}
                    onCreate={() => {}}
                    onClose={() => setEditingAssignee(null)}
                    placeholder="Search people..."
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingAssignee(task.id)}
                    className="text-left w-full text-metadata text-foreground-muted hover:text-foreground truncate"
                  >
                    {task.actionee ? (
                      <span className="text-primary">@{task.actionee.name}</span>
                    ) : (
                      <span className="opacity-40">Assign</span>
                    )}
                  </button>
                )}
              </div>

              {/* Project cell */}
              <div className="relative">
                {editingProject === task.id ? (
                  <EntityCombobox
                    items={allProjects}
                    excludeIds={[]}
                    onSelect={(item) => {
                      handleFieldUpdate(task.id, { project_id: item.id });
                      setEditingProject(null);
                    }}
                    onCreate={() => {}}
                    onClose={() => setEditingProject(null)}
                    placeholder="Search projects..."
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingProject(task.id)}
                    className="text-left w-full text-metadata text-foreground-muted hover:text-foreground truncate"
                  >
                    {task.project ? (
                      <span className="text-primary">{task.project.name}</span>
                    ) : (
                      <span className="opacity-40">Project</span>
                    )}
                  </button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(task.id)}
                disabled={isPending}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Mobile: stacked layout */}
            <div className="sm:hidden space-y-north-xs">
              <div className="flex items-center justify-between gap-north-sm">
                <InlineEditableText
                  value={task.title}
                  onSave={async (v) => {
                    const r = await updateTask(task.id, { title: v });
                    if (!r.error) router.refresh();
                    return r;
                  }}
                  className="text-body flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  className="shrink-0 text-foreground-muted hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-north-sm">
                <TaskStatusBadge status={task.status} />
                {task.priority && (
                  <span className="text-metadata text-foreground-muted">{task.priority}</span>
                )}
                {task.due_date && (
                  <span className="text-metadata text-foreground-muted">
                    Due: {formatDate(task.due_date)}
                  </span>
                )}
                {task.actionee && (
                  <Link
                    href={`/people/${task.actionee.id}`}
                    className="text-metadata text-primary hover:underline"
                  >
                    @{task.actionee.name}
                  </Link>
                )}
                {task.project && (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-metadata text-primary hover:underline"
                  >
                    {task.project.name}
                  </Link>
                )}
                {task.notes && (
                  <Link
                    href={`/notes/${task.notes.id}`}
                    className="text-metadata text-primary hover:underline"
                  >
                    {task.notes.title}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && search.length >= 2 && (
          <p className="font-mono text-metadata text-foreground-muted uppercase tracking-wider pt-north-md">
            <span className="text-primary">{'// '}</span>NO RESULTS FOR &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
