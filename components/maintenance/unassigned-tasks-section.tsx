'use client';

import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { UnassignedTask } from '@/lib/actions/maintenance';

interface UnassignedTasksSectionProps {
  tasks: UnassignedTask[];
}

export function UnassignedTasksSection({ tasks }: UnassignedTasksSectionProps) {
  return (
    <section>
      <h2 className="text-section-header mb-north-sm flex items-center gap-north-xs">
        Unassigned Tasks
        <span className="inline-flex items-center justify-center rounded-full bg-status-new/15 text-status-new text-metadata px-2 py-0.5">
          {tasks.length}
        </span>
      </h2>
      <p className="text-metadata text-foreground-muted mb-north-md">
        Open tasks with no one assigned.
      </p>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-border border-dashed bg-surface-subtle px-north-lg py-north-xl text-center">
          <p className="text-body text-foreground-muted">All tasks have owners. Nice work.</p>
        </div>
      ) : (
        <div className="space-y-north-xs">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.note_id ? `/notes/${task.note_id}` : '/tasks'}
              className="flex items-start gap-north-sm rounded-lg border border-border bg-surface px-north-base py-north-md hover:border-primary/40 hover:bg-sidebar-accent/20 transition-colors"
            >
              <CheckSquare
                className="h-4 w-4 shrink-0 mt-0.5"
                style={{ color: 'var(--entity-tasks)' }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-issue-title truncate block">{task.title}</span>
                <div className="flex items-center gap-north-sm mt-north-xs flex-wrap">
                  {task.priority && (
                    <span className="text-metadata text-foreground-muted">{task.priority}</span>
                  )}
                  {task.project_name && (
                    <span className="text-metadata text-foreground-secondary">
                      {task.project_name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-metadata text-foreground-muted">
                      Due {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
