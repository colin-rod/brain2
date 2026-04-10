import Link from 'next/link';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { FileText, CheckSquare, Scale, HelpCircle, Clock } from 'lucide-react';
import type { TimelineItem } from '@/lib/actions/wiki';
import type { TaskStatus } from '@/types/database';

const typeIcons = {
  note: FileText,
  task: CheckSquare,
  decision: Scale,
  question: HelpCircle,
} as const;

const typeColors = {
  note: 'text-primary',
  task: 'text-status-new',
  decision: 'text-status-saved',
  question: 'text-status-processing',
} as const;

function formatCompactDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

interface EntityTimelineProps {
  items: TimelineItem[];
}

export function EntityTimeline({ items }: EntityTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
        <Clock className="h-4 w-4" />
        Timeline ({items.length})
      </h2>
      <div className="space-y-0">
        {items.map((item) => {
          const Icon = typeIcons[item.type];
          const colorClass = typeColors[item.type];

          const content = (
            <div className="flex gap-north-sm py-north-xs pl-north-md border-l-2 border-border ml-1.5">
              <div className={`shrink-0 mt-0.5 ${colorClass}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-north-sm">
                  <span className="text-metadata text-foreground-muted shrink-0">
                    {formatCompactDate(item.date)}
                  </span>
                  <span className="text-body truncate">{item.title}</span>
                  {item.status && item.type === 'task' && (
                    <TaskStatusBadge status={item.status as TaskStatus} />
                  )}
                </div>
                {item.snippet && (
                  <p className="text-metadata text-foreground-secondary truncate mt-0.5">
                    {item.snippet}
                  </p>
                )}
              </div>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="block hover:bg-surface-subtle rounded-sm transition-colors"
              >
                {content}
              </Link>
            );
          }

          return <div key={`${item.type}-${item.id}`}>{content}</div>;
        })}
      </div>
    </div>
  );
}
