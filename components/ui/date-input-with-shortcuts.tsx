'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDateShortcuts } from '@/lib/date-shortcuts';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';

interface DateInputWithShortcutsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'aria-label'?: string;
  inline?: boolean;
}

export function DateInputWithShortcuts({
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
  inline = false,
}: DateInputWithShortcutsProps) {
  const shortcuts = getDateShortcuts();

  if (inline) {
    return (
      <div className={cn('flex flex-col gap-north-xs', className)}>
        <div className="flex items-center gap-north-xs flex-wrap">
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={ariaLabel}
            className="w-36"
          />
          {value && (
            <span className="text-metadata text-foreground-muted whitespace-nowrap">
              {formatDate(value)}
            </span>
          )}
        </div>
        <div className="flex gap-north-xs flex-wrap">
          {shortcuts.map((s) => (
            <Button
              key={s.label}
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                'text-foreground-muted',
                value === s.value && 'bg-muted text-foreground',
              )}
              onClick={() => onChange(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-north-xs', className)}>
      <div className="flex items-center gap-north-xs">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        />
        {value && (
          <span className="text-metadata text-foreground-muted whitespace-nowrap">
            {formatDate(value)}
          </span>
        )}
      </div>
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
