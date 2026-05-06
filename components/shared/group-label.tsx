interface GroupLabelProps {
  label: string;
}

export function GroupLabel({ label }: GroupLabelProps) {
  return (
    <div className="font-mono text-label uppercase tracking-wider text-foreground-muted px-north-sm py-north-xs bg-surface-subtle border-b border-border">
      {label}
    </div>
  );
}
