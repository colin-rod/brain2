import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-north-xl text-center">
      <Icon className="mx-auto h-10 w-10 text-foreground-muted mb-north-sm" />
      <p className="text-body text-foreground-secondary">{title}</p>
      {description && <p className="text-metadata text-foreground-muted mt-1">{description}</p>}
    </div>
  );
}
