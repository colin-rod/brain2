import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TaskStatus, QuestionStatus } from '@/types/database';

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

const questionStatusStyles: Record<QuestionStatus, string> = {
  open: 'bg-status-new/15 text-status-new border-status-new/30',
  resolved: 'bg-status-saved/15 text-status-saved border-status-saved/30',
};

const questionStatusLabels: Record<QuestionStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
};

export function QuestionStatusBadge({
  status,
  onClick,
}: {
  status: QuestionStatus;
  onClick?: () => void;
}) {
  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(
        'text-label px-1.5 py-0.5 rounded-none uppercase font-mono tracking-wider',
        onClick && 'cursor-pointer hover:opacity-80',
        questionStatusStyles[status],
      )}
    >
      {questionStatusLabels[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-label px-1.5 py-0.5 rounded-none uppercase font-mono tracking-wider',
        taskStatusStyles[status],
      )}
    >
      {taskStatusLabels[status]}
    </Badge>
  );
}
