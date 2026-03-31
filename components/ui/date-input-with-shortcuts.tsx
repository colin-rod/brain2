'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDateShortcuts } from '@/lib/date-shortcuts';
import { cn } from '@/lib/utils';

interface DateInputWithShortcutsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateInputWithShortcuts({
  value,
  onChange,
  className,
}: DateInputWithShortcutsProps) {
  const shortcuts = getDateShortcuts();

  return (
    <div className={cn('space-y-north-xs', className)}>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="flex gap-north-xs flex-wrap">
        {shortcuts.map((s) => (
          <Button
            key={s.label}
            type="button"
            variant="ghost"
            size="xs"
            className={cn('text-foreground-muted', value === s.value && 'bg-muted text-foreground')}
            onClick={() => onChange(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
