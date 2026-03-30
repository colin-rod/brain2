interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-north-xs sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-page-title">{title}</h1>
        {description && <p className="text-foreground-secondary mt-north-xs">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-north-sm">{children}</div>}
    </div>
  );
}
