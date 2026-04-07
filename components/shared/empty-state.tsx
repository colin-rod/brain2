import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconColor?: string;
  bgColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  iconColor,
  bgColor,
}: EmptyStateProps) {
  return (
    <div
      className="border-t border-border pt-north-md"
      style={
        bgColor
          ? {
              backgroundColor: bgColor,
              borderColor: 'transparent',
              padding: 'var(--north-xl)',
              borderRadius: '0.5rem',
            }
          : undefined
      }
    >
      <Icon
        className="mx-auto h-10 w-10 mb-north-sm"
        style={{ color: iconColor ?? 'var(--foreground-muted)' }}
      />
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
