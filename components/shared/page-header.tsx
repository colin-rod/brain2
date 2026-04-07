interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-north-xs sm:flex-row sm:items-center sm:justify-between border-b border-border pb-north-md mb-north-md">
      <div className="border-l-2 border-primary pl-north-sm">
        <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-muted mb-0.5">
          BRAIN2
        </p>
        <h1 className="text-page-title font-sans">{title}</h1>
        {description && (
          <p className="text-metadata text-foreground-muted font-mono uppercase tracking-wider mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-north-sm">{children}</div>}
    </div>
  );
}
