import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/database';

const taskStatusStyles: Record<TaskStatus, string> = {
  todo: 'bg-status-new/15 text-status-new border-status-new/30',
  in_progress: 'bg-status-processing/15 text-status-processing border-status-processing/30',
  done: 'bg-status-saved/15 text-status-saved border-status-saved/30',
  canceled: 'bg-foreground-muted/15 text-foreground-muted border-foreground-muted/30',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[11px] px-1.5 py-0', taskStatusStyles[status])}>
      {taskStatusLabels[status]}
    </Badge>
  );
}
