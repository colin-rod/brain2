import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="border-t border-border pt-north-md">
      <p className="text-metadata font-mono text-foreground-muted uppercase tracking-widest">
        <span className="text-primary">{'// '}</span>
        {title}
      </p>
      {description && (
        <p className="text-metadata font-mono text-foreground-muted mt-1 uppercase tracking-wider">
          {description}
        </p>
      )}
    </div>
  );
}
