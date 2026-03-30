import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { CheckSquare } from 'lucide-react';
import type { Task } from '@/types/database';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tasks')
    .select('*, notes(id, title)')
    .order('created_at', { ascending: false });

  const tasks = (data ?? []) as (Task & { notes: { id: string; title: string } | null })[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Tasks" description="All tasks extracted from your notes." />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks appear here after you save notes with action items."
        />
      ) : (
        <div className="space-y-north-xs">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-north-base py-north-md"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body">{task.title}</p>
                <div className="flex flex-wrap items-center gap-north-sm mt-0.5">
                  {task.priority && (
                    <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                      {task.priority}
                    </Badge>
                  )}
                  {task.due_date && (
                    <span className="text-metadata text-foreground-muted">
                      Due: {task.due_date}
                    </span>
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
              <TaskStatusBadge status={task.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
