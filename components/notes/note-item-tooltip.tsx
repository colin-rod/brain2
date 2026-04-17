'use client';

import { Tooltip } from '@base-ui/react/tooltip';

import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoteItemTooltipProps {
  label: string;
  children: React.ReactNode;
}

export function NoteItemTooltip({ label, children }: NoteItemTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={200}
        className={cn(badgeVariants({ variant: 'secondary' }), 'text-label cursor-default')}
      >
        {label}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" align="start" sideOffset={6}>
          <Tooltip.Popup className="z-50 min-w-48 max-w-72 rounded-lg border border-border bg-popover shadow-md p-north-xs">
            {children}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
