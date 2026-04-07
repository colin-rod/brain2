import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EditorItemCardProps {
  variant?: 'subtle' | 'default';
  children: ReactNode;
  className?: string;
}

export function EditorItemCard({ variant = 'default', children, className }: EditorItemCardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-border',
        variant === 'subtle'
          ? 'bg-surface-subtle p-north-md space-y-north-sm'
          : 'bg-surface px-north-md py-north-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
