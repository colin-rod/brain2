import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
}

export function PageHeader({ title, children, icon: Icon, iconColor }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-north-xs sm:flex-row sm:items-center sm:justify-between border-b border-border pb-north-md mb-north-md">
      <div className="border-l-2 border-primary pl-north-sm animate-slide-in-up">
        <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-muted mb-0.5">
          BRAIN2
        </p>
        <div className="flex items-center gap-north-sm">
          {Icon && (
            <Icon
              className="h-5 w-5 shrink-0"
              style={{ color: iconColor ?? 'var(--foreground-muted)' }}
            />
          )}
          <h1 className="text-page-title">{title}</h1>
        </div>
      </div>
      {children && (
        <div
          className="flex items-center gap-north-sm animate-slide-in-up"
          style={{ animationDelay: '80ms' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
